import os
import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
 # Adjust import path as per your project structure
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.llms import CTransformers, Ollama 
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnablePassthrough
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from django.core.cache import cache


import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chatbot.settings')
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()

class ChatbotConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        from .models import DocumentVector 
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        key = text_data_json['key']
        model=text_data_json['model']
        
        message+="?"
        print(model)
        if not key:
            key='01822316-247d-444e-9921-573d2275c174'
        llm = cache.get('llm'+model+key)
        if llm is None:
            print("\n\ndefining llm")
            llm = Ollama(model=model)
            cache.set('llm'+key, llm, timeout=3600)
       
        embeddings = cache.get('embeddings'+key)
        if embeddings is None:
            print("\n\ndefining embeddings")
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
            cache.set('embeddings'+key, embeddings, timeout=3600)

        retriever = cache.get('retriever'+key)
        if retriever is None:
            print("\n\nGetting Vector From database")
            # Wrap Django ORM operation with sync_to_async
            document_vectors = await sync_to_async(DocumentVector.objects.filter)(key=key)

            if not document_vectors:
                await self.send(text_data=json.dumps({'message': 'Invalid key.'}))
                return
            print("\n\nCreating Retriver")
            class Document:
                def __init__(self, page_content, vector, metadata):
                    self.page_content = page_content
                    self.vector = vector
                    self.metadata = metadata

            documents = [Document(page_content=doc.content, vector=doc.vector,
                                metadata={'filename': doc.filename, 'page_number': doc.page_number})
                        for doc in document_vectors]

            # Assuming FAISS and other components are async-compatible or wrapped appropriately
            db = FAISS.from_documents(documents, embeddings)
            retriever = db.as_retriever(search_kwargs={'k': 2})
            cache.set('retriever'+key, retriever, timeout=3600)


        contextualize_q_system_prompt = """Given a chat history and the latest user question \
        Generate a single question only and do not change the meaning of the question just correct the grammar error \
        which might reference context in the chat history, formulate a standalone question \
        which can be understood without the chat history. Do NOT answer the question, \
        just reformulate it if needed and otherwise return it as is."""

        contextualize_q_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", contextualize_q_system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}"),
            ]
        )

        qa_system_prompt = """You are an assistant for question-answering tasks. \
        Do not generate conversations Just give answer \
        Do not generate the context or extend it just reply what is asked \
        Use the following pieces of retrieved context to answer the question. \
        Do not generate any conversation of human and bot \
        Use Seven sentences maximum and keep the answer concise.\

        {context}"""
        print("\n\nCreating Prompt Template")
        qa_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", qa_system_prompt),
                ("human", "{question}"),
            ]
        )

        reference = []
        def format_docs(docs):
            for doc in docs:
                reference.append([doc.metadata['filename'], doc.metadata['page_number'] + 1])
            return "\n\n".join(doc.page_content for doc in docs)

        contextualize_q_chain = contextualize_q_prompt | llm | StrOutputParser()

        def contextualized_question(input: dict):
            if input.get("chat_history"):
                return contextualize_q_chain
            else:
                return input["question"]
        print("\n\nDefining Our Chain")
        rag_chain = (
            RunnablePassthrough.assign(
                context=contextualized_question | retriever | format_docs
            )
            | qa_prompt
            | llm
        )

        chat_history = cache.get('chat_history'+key)
        if chat_history is None:
            chat_history = []
        print("\n\nCalling llm")
        response=""
        for chunks in rag_chain.stream({"question": message, "chat_history": chat_history}):
            response+=chunks
            await self.send(text_data=json.dumps({
                'message': chunks
            }))
        print("\n\nextending history")
        chat_history.extend(
            [
                HumanMessage(content=message),
                AIMessage(content=response)
            ]
        )
        cache.set('chat_history'+key, chat_history, timeout=3600)
from django.http import StreamingHttpResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User, auth
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.llms import CTransformers, Ollama 
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnablePassthrough
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import tempfile
import uuid
import re
from .models import DocumentVector 
from django.core.cache import cache
import json
# Create your views here.


def store_documents(documents, key,name):
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )
    for doc in documents:
        vector = embeddings.embed_query(doc.page_content)
        filename = name
        page_number = doc.metadata['page']
        print(f"Storing document with filename: {name}, page number: {page_number}")
        document_vector = DocumentVector(
            key=key, 
            content=doc.page_content, 
            vector=vector,
            filename=name,
            page_number=page_number
        )
        document_vector.save()
    cache.delete('retriever'+key)
    print(f"All documents stored successfully for key: {key}")

@api_view(['POST'])
@csrf_exempt
def store_documents_view(request):
    if request.method == 'POST':
        key = request.POST.get('key')
        files = request.FILES.getlist('files')
        print(f"Received {len(files)} files for processing.")
        if not key:
            key = str(uuid.uuid4())
            print(f"Generated new key: {key}")
        if not files:
            print("No files received.")
            return JsonResponse({'message': 'File is required.'}, status=400)

        try:
            for idx, file in enumerate(files):
                name=file.name
                print(f"Processing file {idx + 1}/{len(files)}: {file.name}")
                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    for chunk in file.chunks():
                        tmp_file.write(chunk)
                print(f"Loaded temporary file for: {file.name}")
                loader = PyMuPDFLoader(tmp_file.name, extract_images=True)
                documents = loader.load()
                splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
                texts = splitter.split_documents(documents)

                print(f"Storing documents from file: {file.name}")
                store_documents(texts, key,name)

                print(f"Cleaning up temporary file for: {file.name}")
                os.remove(tmp_file.name)
            print(f"All files processed and stored successfully for key: {key}")
            return Response({'key': key})

        except Exception as e:
            print(f"Error occurred: {str(e)}")
            return Response({'message': str(e)}, status=500)

    return Response({'error': 'Invalid request method.'}, status=400)

@api_view(['POST'])
def verify_key(request):
    if request.method == 'POST':
        key = request.POST.get('key')
        if not key:
            print("giving default key")
            key="01822316-247d-444e-9921-573d2275c174"
        try:
            obj = DocumentVector.objects.filter(key=key)
            if not obj:
                return Response({'valid': False})                
            else:
                return Response({'valid': True})
        except Exception as e:
            return Response({'message': str(e)})
    return Response({'error': 'Invalid request method.'})


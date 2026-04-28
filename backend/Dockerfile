FROM public.ecr.aws/lambda/python:3.11

# Install system dependencies (Amazon Linux 2 uses microdnf)
RUN microdnf install -y gcc && microdnf clean all

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Pre-download the embedding model so it's baked into the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

CMD ["app.main.handler"]

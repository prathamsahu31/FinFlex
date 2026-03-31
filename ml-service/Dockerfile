FROM python:3.10

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

# Install system dependencies for scientific Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libblas-dev \
    liblapack-dev \
    gfortran \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . /code

CMD ["python", "main.py"]

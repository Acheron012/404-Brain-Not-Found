FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.docker.txt /app/requirements.docker.txt

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /app/requirements.docker.txt

COPY schedly /app/schedly

WORKDIR /app/schedly

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

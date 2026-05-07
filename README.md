# Schedly

Schedly is a Django project located in the `schedly/` folder. The app uses SQLite for local development and starts from `schedly/manage.py`.

## Prerequisites

- Python 3.11 or newer
- `pip`

## Install

1. Open a terminal in the project root.
2. Create and activate a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install the dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

## Run the server

1. Change into the Django project folder:

   ```powershell
   cd schedly
   ```

2. Apply migrations:

   ```powershell
   python manage.py migrate
   ```

3. Start the development server:

   ```powershell
   python manage.py runserver
   ```

4. Open the app in your browser at:

   ```
   http://127.0.0.1:8000/
   ```

## Notes

- The project settings module is `amdhackathon.settings`.
- If you want to use the admin site, create a superuser with `python manage.py createsuperuser`.
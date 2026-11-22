# Run the LearnOps Streamlit demo

The repository contains both the original Next.js application and a separate Streamlit entrypoint.

## Run locally

Use Python 3.11 or newer.

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run streamlit_app.py
```

macOS / Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit_app.py
```

## Deploy to Streamlit Community Cloud

1. Sign in at https://share.streamlit.io using GitHub.
2. Click **Create app** and choose the option to use an existing app.
3. Select repository `Kamleshkumarmandal/LearnOps-AI-Student-Success-Platform`.
4. Select branch `main`.
5. Set **Main file path** to `streamlit_app.py`.
6. Optionally choose a memorable app subdomain.
7. Click **Deploy**.

Streamlit Community Cloud reads Python dependencies from the root `requirements.txt`. The `.streamlit/config.toml` file controls the app theme.

## Demo limitations

The Streamlit demo uses in-memory sample data. New learners and mentor queue entries reset when the app restarts. GitHub activity is illustrative. The Next.js webhook endpoint and Supabase schema in this repository are a separate backend foundation and are not automatically connected to this Streamlit dashboard.

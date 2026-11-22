import unittest
from pathlib import Path

from streamlit.testing.v1 import AppTest


class StreamlitAppSmokeTests(unittest.TestCase):
    def test_dashboard_renders_without_exceptions(self):
        app_file = Path(__file__).resolve().parents[1] / "streamlit_app.py"
        app = AppTest.from_file(str(app_file)).run(timeout=40)
        errors = [element.message for element in app.exception]
        self.assertEqual(errors, [], "\n".join(errors))


if __name__ == "__main__":
    unittest.main()

import unittest

from streamlit.testing.v1 import AppTest


class StreamlitAppSmokeTests(unittest.TestCase):
    def test_dashboard_renders_without_exceptions(self):
        app = AppTest.from_file("streamlit_app.py").run(timeout=40)
        errors = [element.message for element in app.exception]
        self.assertEqual(errors, [], "\n".join(errors))


if __name__ == "__main__":
    unittest.main()

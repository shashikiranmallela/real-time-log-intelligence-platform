from fastapi import APIRouter
from elasticsearch import Elasticsearch

router = APIRouter(prefix="/api")

es = Elasticsearch("http://localhost:9200")


# ==================================================
# These routes are now mounted under /api via the router prefix.
# They duplicate/extend what main.py already provides so you can
# keep this file for any extra endpoints you want to add later.
# ==================================================

# The routes below are intentionally left empty so there are no
# conflicts with main.py.  Add NEW endpoints here as needed.

# Example:
# @router.get("/my-new-route")
# def my_new_route():
#     return {"ok": True}

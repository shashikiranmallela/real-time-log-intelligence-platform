from fastapi import APIRouter
from elasticsearch import Elasticsearch

router = APIRouter(prefix="/api")
es = Elasticsearch("http://localhost:9200")

# Add new endpoints here as needed.
# Example:
# @router.get("/my-new-route")
# def my_new_route():
#     return {"ok": True}

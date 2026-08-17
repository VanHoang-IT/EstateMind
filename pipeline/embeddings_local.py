from langchain_core.embeddings import Embeddings
from sentence_transformers import SentenceTransformer


class EstateMindEmbeddings(Embeddings):
    def __init__(self, model_path="training/retriever/models/estatemind-sbert"):
        self.model = SentenceTransformer(model_path)

    def embed_documents(self, texts):
        embeddings = self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, text):
        embedding = self.model.encode([text], normalize_embeddings=True, show_progress_bar=False)
        return embedding[0].tolist()
// IndexedDB service for offline storage
export class StorageService {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("StudyPro", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("lectures")) {
          db.createObjectStore("lectures", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("transcripts")) {
          db.createObjectStore("transcripts", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("summaries")) {
          db.createObjectStore("summaries", { keyPath: "id" });
        }
      };
    });
  }

  async saveLecture(lecture: any) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction("lectures", "readwrite");
    tx.objectStore("lectures").put(lecture);
  }

  async getLecture(id: string) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction("lectures", "readonly");
    return new Promise((resolve) => {
      const req = tx.objectStore("lectures").get(id);
      req.onsuccess = () => resolve(req.result);
    });
  }

  async getAllLectures() {
    if (!this.db) await this.init();
    const tx = this.db!.transaction("lectures", "readonly");
    return new Promise((resolve) => {
      const req = tx.objectStore("lectures").getAll();
      req.onsuccess = () => resolve(req.result);
    });
  }
}

export const storageService = new StorageService();

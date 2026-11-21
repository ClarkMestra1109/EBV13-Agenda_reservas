const DATABASE_NAME = 'agendapro-service-images';
const IMAGE_STORE = 'images';
const METADATA_STORE = 'metadata';

export interface ServiceMetadata {
  location: string;
  mode: 'Presencial' | 'Virtual';
}

let databasePromise: Promise<IDBDatabase> | null = null;

const openDatabase = () => {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('Este navegador no permite guardar imágenes de servicios.'));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, 2);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(IMAGE_STORE)) {
          database.createObjectStore(IMAGE_STORE);
        }
        if (!database.objectStoreNames.contains(METADATA_STORE)) {
          database.createObjectStore(METADATA_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = null;
        reject(request.error || new Error('No fue posible abrir el almacenamiento de imágenes.'));
      };
      request.onblocked = () => {
        databasePromise = null;
        reject(new Error('El almacenamiento de imágenes está bloqueado por otra pestaña.'));
      };
    });
  }

  return databasePromise;
};

const runImageRequest = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    let result: T;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error || new Error('No fue posible guardar la imagen.'));
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(transaction.error || new Error('Se interrumpió el almacenamiento de la imagen.'));
  });
};

export const getServiceImage = (serviceId: number | string) =>
  runImageRequest<string | undefined>(IMAGE_STORE, 'readonly', (store) => store.get(String(serviceId)));

export const saveServiceImage = (serviceId: number | string, imageDataUrl: string) =>
  runImageRequest<IDBValidKey>(IMAGE_STORE, 'readwrite', (store) =>
    store.put(imageDataUrl, String(serviceId))
  );

export const deleteServiceImage = (serviceId: number | string) =>
  runImageRequest<undefined>(IMAGE_STORE, 'readwrite', (store) => store.delete(String(serviceId)));

export const getServiceMetadata = (serviceId: number | string) =>
  runImageRequest<ServiceMetadata | undefined>(METADATA_STORE, 'readonly', (store) =>
    store.get(String(serviceId))
  );

export const saveServiceMetadata = (serviceId: number | string, metadata: ServiceMetadata) =>
  runImageRequest<IDBValidKey>(METADATA_STORE, 'readwrite', (store) =>
    store.put(metadata, String(serviceId))
  );

export const deleteServiceMetadata = (serviceId: number | string) =>
  runImageRequest<undefined>(METADATA_STORE, 'readwrite', (store) => store.delete(String(serviceId)));

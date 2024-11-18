// db.ts
import { openDB, IDBPDatabase } from "idb";
import {
  decryptData,
  deriveKeyFromToken,
  encryptData,
  salt,
} from "./storageUtils";

export interface Record {
  id?: number;
  title: string;
  body: string;
  created_date: string;
  reservation_date: string;
  page: number;
}

export interface PatientRecord {
  id?: number;
  name: string;
  diagnosis: string;
  body: string;
  createdAt: string; // Ngày tạo bệnh án
}

export async function initializeDatabase(): Promise<IDBPDatabase> {
  return openDB("myDatabase", 1, {
    upgrade(db) {
      const store = db.createObjectStore("records", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("pageIndex", "page");
      store.createIndex("createdDateIndex", "created_date");

      const recordStore = db.createObjectStore("patientRecords", {
        keyPath: "id",
        autoIncrement: true,
      });
      recordStore.createIndex("createdAtIndex", "createdAt");
    },
  });
}

export async function insertData( items: Record[]): Promise<void> {
  const db = await initializeDatabase();
  const key = await deriveKeyFromToken(salt); // Lấy khóa từ token

  console.time("Encryption Time"); // Bắt đầu đo thời gian mã hóa
  const encryptedItems = await Promise.all(
    items.map(async (item) => ({
      ...item,
      title: await encryptData(item.title, key),
      body: await encryptData(item.body, key),
    }))
  );
  console.timeEnd("Encryption Time"); // Kết thúc đo thời gian mã hóa

  // Bắt đầu transaction sau khi tất cả dữ liệu đã mã hóa
  const tx = db.transaction("records", "readwrite");
  const store = tx.objectStore("records");

  // Thêm các mục đã mã hóa vào store trong transaction
  for (const encryptedItem of encryptedItems) {
    store.add(encryptedItem); // Không cần `await` tại đây
  }

  // Đợi transaction hoàn tất
  await tx.done;
}

export async function getPageData(
  page: number,
  searchTerm: string = ""
): Promise<Record[]> {
  const db = await initializeDatabase();
  const tx = db.transaction("records");
  const store = tx.objectStore("records").index("pageIndex");

  const allData = await store.getAll(IDBKeyRange.only(page));
  const key = await deriveKeyFromToken(salt); // Lấy khóa từ token

  // console.time("Decryption Time"); // Bắt đầu đo thời gian giải mã
  const decryptedData = await Promise.all(
    allData.map(async (item) => ({
      ...item,
      title: await decryptData(item.title, key),
      body: await decryptData(item.body, key),
    }))
  );
  // console.timeEnd("Decryption Time"); // Kết thúc đo thời gian giải mã

  return searchTerm
    ? decryptedData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : decryptedData;
}

export async function insertPatientRecords(
  records: PatientRecord[]
): Promise<void> {
  const db = await initializeDatabase();
  const key = await deriveKeyFromToken(salt); // Lấy khóa từ token

  // console.time("Encryption Time"); // Bắt đầu đo thời gian mã hóa
  const encryptedItems = await Promise.all(
    records.map(async (item) => ({
      ...item,
      name: await encryptData(item.name, key),
      diagnosis: await encryptData(item.diagnosis, key),
      body: await encryptData(item.body, key),
    }))
  );
  // console.timeEnd("Encryption Time"); // Kết thúc đo thời gian mã hóa

  // Bắt đầu transaction sau khi tất cả dữ liệu đã mã hóa
  const tx = db.transaction("patientRecords", "readwrite");
  const store = tx.objectStore("patientRecords");

  // Thêm các mục đã mã hóa vào store trong transaction
  for (const encryptedItem of encryptedItems) {
    store.add(encryptedItem); // Không cần `await` tại đây
  }

  // Đợi transaction hoàn tất
  await tx.done;
}

export async function getPatientRecords(
  page: number,
  searchTerm: string = ""
): Promise<PatientRecord[]> {
  const db = await initializeDatabase();
  const tx = db.transaction("patientRecords");
  const store = tx.objectStore("patientRecords").index("createdAtIndex");

  const allData = await store.getAll(IDBKeyRange.only(page));
  const key = await deriveKeyFromToken(salt); // Lấy khóa từ token
  console.log(allData);
  console.time("Decryption Time"); // Bắt đầu đo thời gian giải mã
  const decryptedData = await Promise.all(
    allData.map(async (item) => ({
      ...item,
      name: await decryptData(item.name, key),
      diagnosis: await decryptData(item.diagnosis, key),
      body: await decryptData(item.body, key),
    }))
  );
  console.timeEnd("Decryption Time"); // Kết thúc đo thời gian giải mã

  return searchTerm
    ? decryptedData.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : decryptedData;
}

// Populate data for pages if not already populated
(async function populateDatabase() {
  await initializeDatabase();
  for (let page = 1; page <= 1000; page++) {
    const existingData = await getPageData(page);
    if (existingData.length === 0) {
      const items: Record[] = Array.from({ length: 1000 }, (_, i) => ({
        title: `Long Title ${i + 1}: ` + "Lorem ipsum ".repeat(50), // Tiêu đề rất dài
        body: `Long Body ${i + 1}: ` + "Content ".repeat(200), // Nội dung rất dài
        created_date: new Date().toISOString(),
        reservation_date: new Date(Date.now() + i * 86400000).toISOString(),
        page,
      }));
      await insertData(items);
    }
  }

  for (let page = 1; page <= 1000; page++) {
    const existingData = await getPatientRecords(page);
    if (existingData.length === 0) {
      const items: PatientRecord[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `Bệnh nhân ${i + 1}`,
        diagnosis: `Long Title ${i + 1}: ` + "Lorem ipsum ".repeat(50), // Tiêu đề rất dài
        body: `Long Body ${i + 1}: ` + "Content ".repeat(200), // Nội dung rất dài
        createdAt: new Date().toISOString(),
      }));
      await insertPatientRecords(items);
    }
  }

  // for (let page = 1; page <= 10; page++) {
  //   const existingRecords = await getAllPatientRecords();
  //   if (existingRecords.length === 0) {
  //     const patientRecords: PatientRecord[] = Array.from(
  //       { length: 10 },
  //       (_, i) => ({
  //         name: `Bệnh nhân ${i + 1}`,
  //         diagnosis: `Chẩn đoán bệnh ${i + 1}`,
  //         createdAt: new Date(2024, 10, i + 1).toISOString(), // Tạo ngày từ 1 đến 10 tháng 11, 2024
  //       })
  //     );
  //     await insertPatientRecords(patientRecords);
  //   }
  // }
})();

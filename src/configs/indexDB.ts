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
  name: string;
  page: number;
}

export interface PatientRecord {
  id?: number;
  name: string;
  diagnosis: string;
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
      store.createIndex("nameIndex", "name");

      const recordStore = db.createObjectStore("patientRecords", {
        keyPath: "id",
        autoIncrement: true,
      });
      recordStore.createIndex("createdAtIndex", "createdAt");
      recordStore.createIndex("nameIndex", "name");
    },
  });
}

export async function insertData(page: number, items: Record[]): Promise<void> {
  const db = await initializeDatabase();
  const key = await deriveKeyFromToken(salt); // Lấy khóa từ token

  // Mã hóa tất cả dữ liệu trước khi mở transaction
  const encryptedItems = [];
  for (const item of items) {
    const encryptedName = await encryptData(item.name, key); // Mã hóa tên
    encryptedItems.push({ ...item, name: encryptedName, page });
  }

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

// export async function insertData(page: number, items: Record[]): Promise<void> {
//   const db = await initializeDatabase();
//   const key = await deriveKeyFromToken(salt); // Lấy khóa từ token

//   // Mã hóa tất cả dữ liệu trước khi mở transaction
//   const encryptedItems = [];
//   for (const item of items) {
//     const encryptedName = await encryptData(item.name, key); // Mã hóa tên
//     encryptedItems.push({ ...item, name: encryptedName, page });
//   }

//   // Bắt đầu transaction sau khi tất cả dữ liệu đã mã hóa
//   const tx = db.transaction("records", "readwrite");
//   const store = tx.objectStore("records");

//   // Thêm các mục đã mã hóa vào store trong transaction
//   for (const encryptedItem of encryptedItems) {
//     store.add(encryptedItem); // Không cần `await` tại đây
//   }

//   // Đợi transaction hoàn tất
//   await tx.done;
// }


export async function getPageData(
  page: number,
  searchTerm: string = ""
): Promise<Record[]> {
  const db = await initializeDatabase();
  const tx = db.transaction("records");
  const store = tx.objectStore("records").index("pageIndex");

  const allData = await store.getAll(IDBKeyRange.only(page));
  const key = await deriveKeyFromToken(salt); // Lấy khóa từ token

  // Giải mã tên khi lấy dữ liệu
  const decryptedData = await Promise.all(
    allData.map(async (item) => {
      const decryptedName = await decryptData(item.name, key); // Giải mã tên
      return { ...item, name: decryptedName };
    })
  );

  return searchTerm
    ? decryptedData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : decryptedData;
}

// export async function insertPatientRecords(
//   records: PatientRecord[]
// ): Promise<void> {
//   const db = await initializeDatabase();
//   const tx = db.transaction("patientRecords", "readwrite");
//   const store = tx.objectStore("patientRecords");
//   const key = await deriveKeyFromToken(salt);

//   // Mã hóa dữ liệu trước khi lưu
//   const encryptedRecords = await Promise.all(
//     records.map(async (record) => {
//       const encryptedName = await encryptData(record.name, key);
//       const encryptedDiagnosis = await encryptData(record.diagnosis, key);
//       return { ...record, name: encryptedName, diagnosis: encryptedDiagnosis };
//     })
//   );

//   // Thêm dữ liệu vào store
//   for (const item of encryptedRecords) {
//     await store.add(item); // Đảm bảo thêm vào store một cách đồng bộ
//   }

//   // Đảm bảo transaction đã hoàn thành
//   await tx.done;
// }

export async function getAllPatientRecords(
  searchTerm: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<PatientRecord[]> {
  const db = await initializeDatabase();
  const tx = db.transaction("patientRecords");
  const store = tx.objectStore("patientRecords").index("createdAtIndex");
  const allData = await store.getAll();
  const key = await deriveKeyFromToken(salt); // Lấy khóa từ token

  // Giải mã dữ liệu bệnh nhân
  const decryptedData = await Promise.all(
    allData.map(async (item) => {
      const decryptedName = await decryptData(item.name, key);
      const decryptedDiagnosis = await decryptData(item.diagnosis, key);
      return { ...item, name: decryptedName, diagnosis: decryptedDiagnosis };
    })
  );

  // Lọc dữ liệu theo searchTerm
  const filteredData = searchTerm
    ? decryptedData.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : decryptedData;

  // Phân trang dữ liệu
  const startIndex = (page - 1) * pageSize;
  return filteredData.slice(startIndex, startIndex + pageSize);
}


// Populate data for pages if not already populated
(async function populateDatabase() {
  await initializeDatabase();
  for (let page = 1; page <= 10; page++) {
    const existingData = await getPageData(page);
    if (existingData.length === 0) {
      const items: Record[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `Item ${i + 1} on Page ${page}`,
        page,
      }));
      await insertData(page, items);
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

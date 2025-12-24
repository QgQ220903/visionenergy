// ============= GOOGLE APPS SCRIPT – FIXED PHONE & PLATE FORMAT =============
const SHEET_ID = "1TZoMWjfFXm8PISGp59UGt7a33TqZ32vD4MA5ICq9dKM";
const PUBLIC_KEY = "vision2025_secret_key_2209";
const RECAPTCHA_SECRET = "6Lf8tyUsAAAAAHYyKAg5nXRGvj47ifh2986p55dg";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1. KIỂM TRA KEY
    if (data.key !== PUBLIC_KEY) throw "Unauthorized";

    // 2. RECAPTCHA
    if (!data.recaptchaToken) throw "Missing reCAPTCHA token";
    const recaptchaValid = verifyRecaptcha(data.recaptchaToken);
    if (!recaptchaValid) throw "reCAPTCHA verification failed";

    // 3. HONEYPOT
    if (data.honeypot && data.honeypot !== "") throw "Spam detected";

    // 4. VALIDATE & CLEAN DATA
    const rawPhone = data.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, ""); // Chỉ giữ số
    const cleanPlate = data.plate
      ? data.plate.toUpperCase().replace(/[^A-Z0-9-]/g, "")
      : "";
    const cleanName = data.name ? data.name.trim().replace(/<[^>]*>/g, "") : "";
    const mode = data.mode || "new";
    const now = new Date();
    const currentMonth = Utilities.formatDate(now, "GMT+7", "yyyy-MM");

    if (mode === "new") {
      if (!cleanName || cleanName.length < 2) throw "Invalid name";
      if (!/^0[3-9][0-9]{8}$/.test(cleanPhone)) throw "Invalid phone";
    }
    if (!cleanPlate || cleanPlate.length < 6) throw "Invalid plate";

    // 5. RATE LIMIT
    const fp = data.fp || "unknown";
    const cache = CacheService.getScriptCache();
    const recent = cache.get(fp) ? JSON.parse(cache.get(fp)) : [];
    const valid = recent.filter((t) => Date.now() - t < 60000);
    valid.push(Date.now());
    if (valid.length > 5) throw "Too many requests";
    cache.put(fp, JSON.stringify(valid), 120);

    // 6. SHEET
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(
      "DANH SÁCH XE ĐĂNG KÝ NHẬN ƯU ĐÃI"
    );
    const rows = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Tìm row dựa trên biển số (cột D - index 3)
    for (let i = 1; i < rows.length; i++) {
      // So sánh với giá trị đã được clean (vì trong sheet giờ lưu dạng text có thể có dấu ')
      const plateInSheet = rows[i][3].toString().replace(/^'+/, ""); // bỏ dấu ' nếu có
      if (plateInSheet === cleanPlate) {
        rowIndex = i + 1;
        break;
      }
    }

    // ===== BUỘC TEXT CHO PHONE & PLATE KHI GHI =====
    const textPhone = "'" + (mode === "new" ? cleanPhone : ""); // Chỉ lưu phone khi đăng ký mới
    const textPlate = "'" + cleanPlate; // Luôn thêm ' để buộc text

    if (mode === "new") {
      if (rowIndex !== -1)
        throw "Đã đăng ký rồi! Vui lòng dùng chế độ Thành viên cũ.";

      // Thêm dòng mới
      sheet.appendRow([
        now, // A: Timestamp
        cleanName, // B: Tên
        textPhone, // C: Số điện thoại → có ' ở đầu → giữ nguyên 0
        textPlate, // D: Biển số → có ' ở đầu → không bị thành số khoa học
        1, // E: TotalCharges
        1, // F: MonthlyCharges
      ]);

      return ContentService.createTextOutput(
        JSON.stringify({ status: "success" })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      // mode === "existing" (thành viên cũ)
      if (rowIndex === -1) throw "Chưa là thành viên! Vui lòng đăng ký mới.";

      // Cập nhật lần sạc
      let total = sheet.getRange(rowIndex, 5).getValue() + 1;
      let monthly = sheet.getRange(rowIndex, 6).getValue();

      const lastTimestamp = sheet.getRange(rowIndex, 1).getValue();
      const lastMonth = Utilities.formatDate(
        lastTimestamp || now,
        "GMT+7",
        "yyyy-MM"
      );

      if (lastMonth !== currentMonth) {
        monthly = 1;
      } else {
        monthly += 1;
      }

      // Cập nhật dữ liệu
      sheet.getRange(rowIndex, 1).setValue(now); // Timestamp
      sheet.getRange(rowIndex, 5).setValue(total); // Total
      sheet.getRange(rowIndex, 6).setValue(monthly); // Monthly
      // Không cần ghi lại biển số vì đã có, nhưng nếu muốn chắc chắn có thể ghi lại textPlate
      sheet.getRange(rowIndex, 4).setValue(textPlate); // Ghi lại biển số với ' để an toàn

      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          total: total,
          monthly: monthly,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    Logger.log("Error: " + err);
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: err.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/* ================= DO GET – LẤY SỐ LẦN SẠC ================= */
function doGet(e) {
  try {
    const plate = (e.parameter.plate || "")
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "");
    if (!plate) throw "Missing plate";

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(
      "DANH SÁCH XE ĐĂNG KÝ NHẬN ƯU ĐÃI"
    );
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const plateInSheet = rows[i][3].toString().replace(/^'+/, "");
      if (plateInSheet === plate) {
        return ContentService.createTextOutput(
          JSON.stringify({
            total: rows[i][4],
            monthly: rows[i][5],
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    throw "Not found";
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// VERIFY RECAPTCHA
function verifyRecaptcha(token) {
  try {
    const response = UrlFetchApp.fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "post",
        payload: {
          secret: RECAPTCHA_SECRET,
          response: token,
        },
      }
    );
    const result = JSON.parse(response.getContentText());
    return result.success && result.score >= 0.5;
  } catch (e) {
    return false;
  }
}

// OPTIONAL: Chạy 1 lần để format cột (không bắt buộc nữa vì đã dùng ')
function setupColumnFormats() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(
    "DANH SÁCH XE ĐĂNG KÝ NHẬN ƯU ĐÃI"
  );
  sheet.getRange("A:A").setNumberFormat("dd/MM/yyyy HH:mm:ss");
  sheet.getRange("C:C").setNumberFormat("@"); // Phone → text
  sheet.getRange("D:D").setNumberFormat("@"); // Plate → text (dự phòng)
  sheet.getRange("E:F").setNumberFormat("0");
}

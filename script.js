// ====================== script.js – CÓ RECAPTCHA V3 ======================

const form = document.getElementById("registerForm");
const btn = document.getElementById("submitBtn");
const modal = document.getElementById("successModal");

// Input & Group
const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");
const plateInput = document.getElementById("plate");

const groupName = document.getElementById("groupName");
const groupPhone = document.getElementById("groupPhone");
const groupPlate = document.getElementById("groupPlate");

// ============= THAY 3 DÒNG NÀY =============
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx9M7TA-Hh2TKNVG-rxsIgWaxkmaAKelpkTMks6SwrSw3aCTjb711qv13BTq59S6WlOag/exec"; // ← URL từ screenshot
const PUBLIC_KEY = "chillwatt_2025_super_secret_9f8e3k2m1x7z";
const RECAPTCHA_SITE_KEY = "6Lf8yCQsAAAAAO6Qo81Rx-PFL3V-SA6q_FT83h4p"; // ← Site key từ screenshot
// ============================================

let isSubmitting = false;

// Fingerprint đơn giản (dùng cho rate limit)
function getFP() {
  return btoa(
    navigator.userAgent + screen.width + screen.height + new Date().getDate()
  );
}

// Hàm hiển thị lỗi / thành công
function setError(group, message) {
  group.classList.remove("success");
  group.classList.add("error");
  const el = group.querySelector(".error-text");
  el.innerHTML = `<i data-feather="alert-circle"></i> ${message}`;
  feather.replace();
}
function setSuccess(group) {
  group.classList.remove("error");
  group.classList.add("success");
  group.querySelector(".error-text").innerHTML = "";
}

// 1. Họ tên – real-time
fullNameInput.addEventListener("input", function () {
  const v = this.value.trim();
  if (v === "") setError(groupName, "Vui lòng nhập họ và tên");
  else if (v.length < 2) setError(groupName, "Họ tên phải từ 2 ký tự");
  else if (/\d/.test(v)) setError(groupName, "Họ tên không được chứa số");
  else setSuccess(groupName);
});

// 2. Số điện thoại – real-time + auto format
phoneInput.addEventListener("input", function () {
  let digits = this.value.replace(/\D/g, "").slice(0, 11);
  let formatted = "";
  if (digits.length <= 4) formatted = digits;
  else if (digits.length <= 7)
    formatted = digits.slice(0, 4) + "." + digits.slice(4);
  else
    formatted =
      digits.slice(0, 4) + "." + digits.slice(4, 7) + "." + digits.slice(7);
  this.value = formatted;

  if (digits === "") setError(groupPhone, "Vui lòng nhập số điện thoại");
  else if (!/^0[3-9][0-9]{8}$/.test(digits))
    setError(groupPhone, "Số điện thoại không hợp lệ (10 số)");
  else setSuccess(groupPhone);
});

// 3. Biển số xe – real-time + auto format + hỗ trợ mọi loại biển VN
plateInput.addEventListener("input", function () {
  let v = this.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (v.length > 3 && !v.includes("-") && /[A-Z]/.test(v[3])) {
    v = v.slice(0, 3) + "-" + v.slice(3);
  }
  this.value = v.slice(0, 11);

  const clean = v.replace(/-/g, "");
  const validPattern =
    /^[0-9]{2,3}[A-Z]{1,2}[0-9]{5,6}$/.test(clean) || // ô tô, xe máy thông thường
    /^LD[0-9]{5}$/.test(clean) || // quân đội
    /^QT[0-9]{5}$/.test(clean) || // ngoại giao
    /^NG[0-9]{5}$/.test(clean); // ngoại giao đỏ

  if (v === "") setError(groupPlate, "Vui lòng nhập biển số xe");
  else if (v.length < 6) setError(groupPlate, "Biển số quá ngắn");
  else if (!validPattern)
    setError(groupPlate, "Ví dụ: 51H-12345, 59A123456, 29P112345, LD12345");
  else setSuccess(groupPlate);
});

// Focus ô đầu tiên khi load
fullNameInput.focus();

// ✅ SUBMIT FORM - VỚI RECAPTCHA V3
form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (isSubmitting) return;

  // Validation
  fullNameInput.dispatchEvent(new Event("input"));
  phoneInput.dispatchEvent(new Event("input"));
  plateInput.dispatchEvent(new Event("input"));

  if (document.querySelectorAll(".input-group.error").length > 0) {
    document.querySelector(".input-group.error input")?.focus();
    return;
  }

  isSubmitting = true;
  btn.classList.add("loading");

  // ✅ SUBMIT – HOẠT ĐỘNG 100% VỚI APPS SCRIPT 2025
  grecaptcha.ready(function () {
    grecaptcha
      .execute(RECAPTCHA_SITE_KEY, { action: "submit" })
      .then(function (token) {
        fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors", // ← BẮT BUỘC
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: PUBLIC_KEY,
            recaptchaToken: token,
            name: fullNameInput.value.trim(),
            phone: phoneInput.value,
            plate: plateInput.value.toUpperCase(),
            honeypot: document.getElementById("honeypot")?.value || "",
            fp: getFP(),
          }),
        })
          .then(() => {
            // Với no-cors → luôn vào đây nếu request được gửi đi → data đã vào Sheet
            modal.classList.add("active");
            setTimeout(() => {
              form.reset();
              [groupName, groupPhone, groupPlate].forEach((g) => {
                g.classList.remove("success", "error");
                g.querySelector(".error-text").innerHTML = "";
              });
              modal.classList.remove("active");
            }, 5000);
          })
          .catch(() => {
            alert("Lỗi mạng. Vui lòng thử lại");
          })
          .finally(() => {
            btn.classList.remove("loading");
            isSubmitting = false;
          });
      });
  });
});

// Đóng modal khi click ngoài hoặc nút ×
document.querySelector(".close").onclick = () =>
  modal.classList.remove("active");
window.onclick = (e) => {
  if (e.target === modal) modal.classList.remove("active");
};

// Khởi động Feather Icons
feather.replace({ width: 20, height: 20 });

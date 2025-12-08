// script.js – PHIÊN BẢN HOÀN CHỈNH, MODAL CHẠY NGON 100%
const form = document.getElementById("registerForm");
const btn = document.getElementById("submitBtn");
const modal = document.getElementById("successModal");
const closeBtn = document.querySelector(".modal .close");

// Input & Group
const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");
const plateInput = document.getElementById("plate");
const groupName = document.getElementById("groupName");
const groupPhone = document.getElementById("groupPhone");
const groupPlate = document.getElementById("groupPlate");

// CẤU HÌNH
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx9M7TA-Hh2TKNVG-rxsIgWaxkmaAKelpkTMks6SwrSw3aCTjb711qv13BTq59S6WlOag/exec";
const PUBLIC_KEY = "chillwatt_2025_super_secret_9f8e3k2m1x7z";
const RECAPTCHA_SITE_KEY = "6Lf8yCQsAAAAAO6Qo81Rx-PFL3V-SA6q_FT83h4p";

let isSubmitting = false;

// Hàm hiển thị lỗi / thành công
function setError(group, msg) {
  group.classList.remove("success");
  group.classList.add("error");
  const el = group.querySelector(".error-text");
  if (el) {
    el.innerHTML = `<i data-feather="alert-circle"></i> ${msg}`;
    el.style.display = "flex";
  }
}
function setSuccess(group) {
  group.classList.remove("error");
  group.classList.add("success");
  const el = group.querySelector(".error-text");
  if (el) el.style.display = "none";
}

// === VALIDATE REAL-TIME ===
fullNameInput.addEventListener("input", () => {
  const v = fullNameInput.value.trim();
  if (!v) setError(groupName, "Vui lòng nhập họ tên");
  else if (v.length < 2) setError(groupName, "Họ tên quá ngắn");
  else if (/\d/.test(v)) setError(groupName, "Không được chứa số");
  else setSuccess(groupName);
});

phoneInput.addEventListener("input", () => {
  let digits = phoneInput.value.replace(/\D/g, "").slice(0, 11);
  phoneInput.value = digits.replace(/(\d{4})(\d{3})(\d{4})/, "$1.$2.$3");
  if (!digits) setError(groupPhone, "Vui lòng nhập số điện thoại");
  else if (!/^0[3-9]\d{8}$/.test(digits))
    setError(groupPhone, "Số điện thoại không hợp lệ");
  else setSuccess(groupPhone);
});

plateInput.addEventListener("input", () => {
  let v = plateInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (v.length > 3 && !v.includes("-")) v = v.slice(0, 3) + "-" + v.slice(3);
  plateInput.value = v.slice(0, 11);
  if (!v) setError(groupPlate, "Vui lòng nhập biển số");
  else if (v.length < 6) setError(groupPlate, "Biển số quá ngắn");
  else setSuccess(groupPlate);
});

// === SUBMIT FORM ===
form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (isSubmitting) return;

  // Kiểm tra lại toàn bộ
  fullNameInput.dispatchEvent(new Event("input"));
  phoneInput.dispatchEvent(new Event("input"));
  plateInput.dispatchEvent(new Event("input"));

  if (document.querySelectorAll(".input-group.error").length > 0) {
    document.querySelector(".input-group.error input")?.focus();
    return;
  }

  isSubmitting = true;
  btn.classList.add("loading");

  grecaptcha.ready(function () {
    grecaptcha
      .execute(RECAPTCHA_SITE_KEY, { action: "submit" })
      .then(function (token) {
        fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: PUBLIC_KEY,
            recaptchaToken: token,
            name: fullNameInput.value.trim(),
            phone: phoneInput.value,
            plate: plateInput.value.toUpperCase(),
            honeypot: document.getElementById("honeypot")?.value || "",
          }),
        })
          .then(() => {
            // Với no-cors → luôn vào đây nếu request được gửi
            modal.style.display = "block"; // FIX 1: DÙNG display: block
            modal.classList.add("active"); // giữ class active nếu cần animation
            feather.replace();
          })
          .catch(() => {
            alert("Lỗi mạng, vui lòng thử lại!");
          })
          .finally(() => {
            btn.classList.remove("loading");
            isSubmitting = false;
          });
      });
  });
});

// === ĐÓNG MODAL ===
closeBtn.onclick = () => {
  modal.style.display = "none";
  modal.classList.remove("active");
};
window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
};

// Khởi động Feather Icons
document.addEventListener("DOMContentLoaded", () => {
  feather.replace();
});

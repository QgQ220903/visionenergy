// ==================== VISION ENERGY STATION – FINAL PRO VERSION ====================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const btn = form.querySelector(".btn-submit");
  const popup = document.getElementById("popup");
  const zaloLink = document.getElementById("zaloLink");

  // === CẤU HÌNH (chỉ sửa link Zalo khi có) ===
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzTAwIi0lOv6l9lcDpQZvwvlEp9qHZW0fFCCcfYPEv5Cy3PoQeCRdOKD35LcnUChSa1Hg/exec";
  const PUBLIC_KEY = "vision2025_secret_key_2209";
  const RECAPTCHA_SITE_KEY = "6Lf8tyUsAAAAAEu6lXwj5Td_TM3jVnF_P5Hmu14h";

  // SỬA DÒNG NÀY KHI CÓ GROUP ZALO THẬT
  // zaloLink.href = "https://zalo.me/g/isscys844"; // ←←← SỬA SAU NHÉ!

  let isSubmitting = false;

  const fullname = document.getElementById("fullname");
  const phone = document.getElementById("phone");
  const plate = document.getElementById("plate");

  const groupFullname = fullname.parentElement;
  const groupPhone = phone.parentElement;
  const groupPlate = plate.parentElement;

  // Hàm hỗ trợ
  function setError(group, message = "") {
    group.classList.add("error");
    group.classList.remove("success");
    // Nếu muốn hiện chữ lỗi dưới input thì bật đoạn này lên
    // let errEl = group.querySelector(".error-msg");
    // if (!errEl) { errEl = document.createElement("div"); errEl.className="error-msg"; group.appendChild(errEl); }
    // errEl.textContent = message;
  }
  function setSuccess(group) {
    group.classList.add("success");
    group.classList.remove("error");
  }
  function removeStatus(group) {
    group.classList.remove("error", "success");
  }

  // ==================== 1. HỌ VÀ TÊN ====================
  fullname.addEventListener("input", () => {
    const v = fullname.value.trim();
    removeStatus(groupFullname);
    if (!v) return;
    if (v.length < 4) {
      setError(groupFullname);
    } else if (/\d/.test(v)) {
      setError(groupFullname);
    } else if (/[^a-zA-ZÀ-ỹ\s]/.test(v.replace(/[\s-]/g, ""))) {
      setError(groupFullname); // không cho ký tự đặc biệt ngoài dấu cách và gạch ngang
    } else {
      setSuccess(groupFullname);
    }
  });

  // ==================== 2. SỐ ĐIỆN THOẠI ====================
  phone.addEventListener("input", () => {
    let digits = phone.value.replace(/\D/g, "").slice(0, 11);
    // Format lại đẹp (0907 111 222)
    if (digits.length >= 10) {
      phone.value = digits.replace(/(\d{4})(\d{3})(\d{3,4})/, "$1 $2 $3");
    } else {
      phone.value = digits;
    }

    removeStatus(groupPhone);
    if (!digits) return;

    // Regex chặt: bắt đầu 0, sau là 3-9, tổng 9-10 chữ số sau 0
    const phoneRegex = /^0[3-9]\d{8,9}$/;
    const isValid = phoneRegex.test(digits);

    if (isValid) {
      setSuccess(groupPhone);
    } else {
      setError(groupPhone);
    }
  });
  // ==================== 3. BIỂN SỐ XE – SIÊU CHẶT & ĐẸP ====================
  plate.addEventListener("input", () => {
    let v = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); // chỉ cho chữ cái + số

    // Tự động thêm dấu gạch sau 2 hoặc 3 ký tự đầu (tùy theo kiểu biển)
    if (v.length > 2 && !v.includes("-")) {
      // Nếu bắt đầu bằng số (biển mới): 51H-12345
      if (/^\d/.test(v)) {
        if (v.length >= 3) v = v.slice(0, 3) + "-" + v.slice(3);
      } else {
        // Biển cũ: 51H12345 → 51H-12345
        if (v.length >= 4) v = v.slice(0, 4) + "-" + v.slice(4);
      }
    }

    plate.value = v.slice(0, 12);
    removeStatus(groupPlate);

    if (v.length >= 7) {
      // ít nhất 51A-123 hoặc 51H1234
      setSuccess(groupPlate);
    } else if (v.length > 0) {
      setError(groupPlate);
    }
  });

  // ==================== SUBMIT ====================
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    // Kích hoạt validate lần cuối
    fullname.dispatchEvent(new Event("input"));
    phone.dispatchEvent(new Event("input"));
    plate.dispatchEvent(new Event("input"));

    // Nếu có lỗi → focus vào ô đầu tiên bị lỗi
    const errorGroup = document.querySelector(".input-group.error");
    if (errorGroup) {
      errorGroup.querySelector("input").focus();
      return;
    }

    // OK → gửi đi
    isSubmitting = true;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang gửi...`;

    grecaptcha.ready(() => {
      grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action: "vision_register" })
        .then((token) => {
          fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: PUBLIC_KEY,
              recaptchaToken: token,
              name: fullname.value.trim(),
              phone: phone.value.replace(/\s/g, ""),
              plate: plate.value.toUpperCase(),
              timestamp: new Date().toLocaleString("vi-VN"),
            }),
          })
            .then(() => {
              popup.style.display = "flex";
              form.reset();
              [groupFullname, groupPhone, groupPlate].forEach(removeStatus);
            })
            .catch(() => {
              alert("Lỗi kết nối, vui lòng thử lại sau vài phút nhé!");
            })
            .finally(() => {
              btn.disabled = false;
              btn.innerHTML = `ĐĂNG KÝ NGAY <i class="fas fa-arrow-right"></i>`;
              isSubmitting = false;
            });
        });
    });
  });

  // === CHỈ ĐÓNG POPUP KHI BẤM NÚT X (KHÔNG CHO BẤM RA NGOÀI) ===
  document.getElementById("closePopup").addEventListener("click", () => {
    popup.style.display = "none";
  });
});

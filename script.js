/** 
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
  // // ==================== 3. BIỂN SỐ XE – SIÊU CHẶT & ĐẸP ====================
  // plate.addEventListener("input", () => {
  //   let v = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); // chỉ cho chữ cái + số

  //   // Tự động thêm dấu gạch sau 2 hoặc 3 ký tự đầu (tùy theo kiểu biển)
  //   if (v.length > 2 && !v.includes("-")) {
  //     // Nếu bắt đầu bằng số (biển mới): 51H-12345
  //     if (/^\d/.test(v)) {
  //       if (v.length >= 3) v = v.slice(0, 3) + "-" + v.slice(3);
  //     } else {
  //       // Biển cũ: 51H12345 → 51H-12345
  //       if (v.length >= 4) v = v.slice(0, 4) + "-" + v.slice(4);
  //     }
  //   }

  //   plate.value = v.slice(0, 12);
  //   removeStatus(groupPlate);

  //   if (v.length >= 7) {
  //     // ít nhất 51A-123 hoặc 51H1234
  //     setSuccess(groupPlate);
  //   } else if (v.length > 0) {
  //     setError(groupPlate);
  //   }
  // });

  plate.addEventListener("input", () => {
    let raw = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let formatted = "";

    // Biển xe Việt Nam: 2 số đầu là mã tỉnh
    if (raw.length >= 1) {
      // Thêm 2 số đầu (mã tỉnh)
      formatted = raw.slice(0, 2);

      if (raw.length > 2) {
        // Thêm dấu gạch sau mã tỉnh
        formatted += "-" + raw.charAt(2);

        if (raw.length > 3) {
          // Thêm các ký tự còn lại (số)
          formatted += raw.slice(3, 8); // Tối đa 5 số
        }
      }
    } else {
      formatted = raw;
    }

    plate.value = formatted;
    removeStatus(groupPlate);

    // Validate: Cần có format đầy đủ: XX-YZZZZZ
    // X: số (2 ký tự) - mã tỉnh
    // Y: chữ cái (1 ký tự) - loại xe
    // Z: số (4-5 ký tự) - số thứ tự
    const platePattern = /^\d{2}-[A-Z]\d{4,5}$/;

    if (platePattern.test(formatted)) {
      setSuccess(groupPlate);
    } else if (formatted.length > 0) {
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
**/
/** 
// ==================== VISION ENERGY STATION – UPDATED WITH MODES ====================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const btnSubmit = form.querySelector(".btn-submit");
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");
  const errorMessage = document.getElementById("error-message");
  const modeButtons = document.querySelectorAll(".mode-btn");
  const fullnameGroup = document.querySelector(".fullname-group");
  const phoneGroup = document.querySelector(".phone-group");
  const fullname = document.getElementById("fullname");
  const phone = document.getElementById("phone");
  const plate = document.getElementById("plate");
  let currentMode = "new"; // default
  let optimisticTotal = null;
  let optimisticMonthly = null;

  // === CẤU HÌNH ===
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbw7aopppmX9CNQzL5RJSepXy90-m2PUmA1DJoKDB7qwMng_vIyS4q2iFmxXHD3SAHvzIQ/exec";
  const PUBLIC_KEY = "vision2025_secret_key_2209";
  const RECAPTCHA_SITE_KEY = "6Lf8tyUsAAAAAEu6lXwj5Td_TM3jVnF_P5Hmu14h";
  let isSubmitting = false;

  // Switch mode
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      if (currentMode === "new") {
        fullnameGroup.classList.remove("hidden");
        phoneGroup.classList.remove("hidden");

        fullname.required = true;
        phone.required = true;

        btn.innerHTML = `ĐĂNG KÝ NGAY <i class="fas fa-arrow-right"></i>`;
      } else {
        fullnameGroup.classList.add("hidden");
        phoneGroup.classList.add("hidden");

        fullname.required = false;
        phone.required = false;

        btn.innerHTML = `CẬP NHẬT LẦN SẠC <i class="fas fa-arrow-right"></i>`;
      }

      form.reset();
      errorMessage.textContent = "";
      [fullnameGroup, phoneGroup, plate.parentElement].forEach(removeStatus);
    });
  });

  // Hàm hỗ trợ validate (giữ nguyên như cũ)
  function setError(group, message = "") {
    group.classList.add("error");
    group.classList.remove("success");
  }
  function setSuccess(group) {
    group.classList.add("success");
    group.classList.remove("error");
  }
  function removeStatus(group) {
    group.classList.remove("error", "success");
  }

  // Validate inputs (giữ nguyên)
  fullname.addEventListener("input", () => {
    const v = fullname.value.trim();
    removeStatus(fullnameGroup);
    if (!v) return;
    if (
      v.length < 4 ||
      /\d/.test(v) ||
      /[^a-zA-ZÀ-ỹ\s]/.test(v.replace(/[\s-]/g, ""))
    ) {
      setError(fullnameGroup);
    } else {
      setSuccess(fullnameGroup);
    }
  });

  phone.addEventListener("input", () => {
    let digits = phone.value.replace(/\D/g, "").slice(0, 11);
    if (digits.length >= 10) {
      phone.value = digits.replace(/(\d{4})(\d{3})(\d{3,4})/, "$1 $2 $3");
    } else {
      phone.value = digits;
    }
    removeStatus(phoneGroup);
    if (!digits) return;
    const phoneRegex = /^0[3-9]\d{8,9}$/;
    if (phoneRegex.test(digits)) {
      setSuccess(phoneGroup);
    } else {
      setError(phoneGroup);
    }
  });

  plate.addEventListener("input", () => {
    let raw = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let formatted = "";
    if (raw.length >= 1) {
      formatted = raw.slice(0, 2);
      if (raw.length > 2) {
        formatted += "-" + raw.charAt(2);
        if (raw.length > 3) {
          formatted += raw.slice(3, 8);
        }
      }
    } else {
      formatted = raw;
    }
    plate.value = formatted;
    removeStatus(plate.parentElement);
    const platePattern = /^\d{2}-[A-Z]\d{4,5}$/;
    if (platePattern.test(formatted)) {
      setSuccess(plate.parentElement);
    } else if (formatted.length > 0) {
      setError(plate.parentElement);
    }
  });

  // Submit
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    errorMessage.textContent = "";

    // Validate based on mode
    if (currentMode === "new") {
      fullname.dispatchEvent(new Event("input"));
      phone.dispatchEvent(new Event("input"));
    }
    plate.dispatchEvent(new Event("input"));

    const errorGroup = document.querySelector(".input-group.error");
    if (errorGroup) {
      errorGroup.querySelector("input").focus();
      return;
    }

    isSubmitting = true;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang xử lý...`;

    grecaptcha.ready(() => {
      grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action: "vision_register" })
        .then((token) => {
          const data = {
            key: PUBLIC_KEY,
            recaptchaToken: token,
            mode: currentMode,
            name: currentMode === "new" ? fullname.value.trim() : "",
            phone: currentMode === "new" ? phone.value.replace(/\s/g, "") : "",
            plate: plate.value.toUpperCase(),
            timestamp: new Date().toLocaleString("vi-VN"),
          };

          fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
            .then(() => {
              popup.style.display = "flex";

              if (currentMode === "existing") {
                // nếu chưa có số trước đó thì coi như 0
                optimisticTotal = (optimisticTotal ?? 0) + 1;
                optimisticMonthly = (optimisticMonthly ?? 0) + 1;

                popupMessage.innerHTML = `
                ⏳ Đang đồng bộ dữ liệu...<br><br>
                🔋 Tổng lần sạc: <b>${optimisticTotal}</b><br>
                📆 Tháng này: <b>${optimisticMonthly}</b>`;
                fetch(
                  `${APPS_SCRIPT_URL}?plate=${encodeURIComponent(plate.value)}`
                )
                  .then((res) => res.json())
                  .then((data) => {
                    if (!data || data.error) return;

                    // sync lại số thật từ server
                    optimisticTotal = data.total;
                    optimisticMonthly = data.monthly;

                    popupMessage.innerHTML = `
      ✅ Cập nhật thành công!<br><br>
      🔋 Tổng lần sạc: <b>${data.total}</b><br>
      📆 Tháng này: <b>${data.monthly}</b>
    `;
                  })
                  .catch(() => {
                    // nếu GET lỗi → vẫn giữ +1
                    popupMessage.innerHTML += `
      <br><br><small>(Dữ liệu sẽ tự đồng bộ sau)</small>
    `;
                  });
              } else {
                popupMessage.textContent =
                  "Đăng ký thành công. Chúng tôi sẽ liên hệ ngay!";
              }

              form.reset();
              [fullnameGroup, phoneGroup, plate.parentElement].forEach(
                removeStatus
              );
            })

            .catch((err) => {
              errorMessage.textContent =
                err.message || "Lỗi kết nối, thử lại sau!";
            })
            .finally(() => {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML =
                currentMode === "new"
                  ? `ĐĂNG KÝ NGAY <i class="fas fa-arrow-right"></i>`
                  : `CẬP NHẬT LẦN SẠC <i class="fas fa-arrow-right"></i>`;
              isSubmitting = false;
            });
        });
    });
  });

  // Đóng popup
  document.getElementById("closePopup").addEventListener("click", () => {
    popup.style.display = "none";
  });
});
**/

// ==================== VISION ENERGY STATION – OPTIMIZED VERSION ====================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const btnSubmit = form.querySelector(".btn-submit");
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");
  const errorMessage = document.getElementById("error-message");
  const modeButtons = document.querySelectorAll(".mode-btn");
  const fullnameGroup = document.querySelector(".fullname-group");
  const phoneGroup = document.querySelector(".phone-group");
  const fullname = document.getElementById("fullname");
  const phone = document.getElementById("phone");
  const plate = document.getElementById("plate");
  let currentMode = "new"; // default
  let optimisticTotal = null;
  let optimisticMonthly = null;

  // === CẤU HÌNH ===
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbw7aopppmX9CNQzL5RJSepXy90-m2PUmA1DJoKDB7qwMng_vIyS4q2iFmxXHD3SAHvzIQ/exec";
  const PUBLIC_KEY = "vision2025_secret_key_2209";
  const RECAPTCHA_SITE_KEY = "6Lf8tyUsAAAAAEu6lXwj5Td_TM3jVnF_P5Hmu14h";
  let isSubmitting = false;

  // Switch mode
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      if (currentMode === "new") {
        fullnameGroup.classList.remove("hidden");
        phoneGroup.classList.remove("hidden");
        fullname.required = true;
        phone.required = true;
        btnSubmit.innerHTML = `ĐĂNG KÝ NGAY <i class="fas fa-arrow-right"></i>`;
      } else {
        fullnameGroup.classList.add("hidden");
        phoneGroup.classList.add("hidden");
        fullname.required = false;
        phone.required = false;
        btnSubmit.innerHTML = `CẬP NHẬT LẦN SẠC <i class="fas fa-arrow-right"></i>`;
      }

      form.reset();
      errorMessage.textContent = "";
      [fullnameGroup, phoneGroup, plate.parentElement].forEach(removeStatus);
    });
  });

  // Hàm hỗ trợ validate
  function setError(group, message = "") {
    group.classList.add("error");
    group.classList.remove("success");
  }
  function setSuccess(group) {
    group.classList.add("success");
    group.classList.remove("error");
  }
  function removeStatus(group) {
    group.classList.remove("error", "success");
  }

  // Validate inputs
  fullname.addEventListener("input", () => {
    const v = fullname.value.trim();
    removeStatus(fullnameGroup);
    if (!v) return;
    if (
      v.length < 4 ||
      /\d/.test(v) ||
      /[^a-zA-ZÀ-ỹ\s]/.test(v.replace(/[\s-]/g, ""))
    ) {
      setError(fullnameGroup);
    } else {
      setSuccess(fullnameGroup);
    }
  });

  phone.addEventListener("input", () => {
    let digits = phone.value.replace(/\D/g, "").slice(0, 11);
    if (digits.length >= 10) {
      phone.value = digits.replace(/(\d{4})(\d{3})(\d{3,4})/, "$1 $2 $3");
    } else {
      phone.value = digits;
    }
    removeStatus(phoneGroup);
    if (!digits) return;
    const phoneRegex = /^0[3-9]\d{8,9}$/;
    if (phoneRegex.test(digits)) {
      setSuccess(phoneGroup);
    } else {
      setError(phoneGroup);
    }
  });

  plate.addEventListener("input", () => {
    // Lấy giá trị, chuyển uppercase và chỉ giữ chữ cái + số
    let raw = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    let formatted = "";

    if (raw.length > 0) {
      // Phần đầu: 3 ký tự (ví dụ: 51F, 59A, 43B...)
      let prefix = raw.slice(0, 3);

      // Phần số sau: từ ký tự thứ 4 trở đi, tối đa 5 số
      let numbers = raw.slice(3, 8); // giới hạn 5 số

      formatted = prefix;

      // Tự động thêm dấu gạch ngang khi đã nhập đủ 3 ký tự đầu và có ít nhất 1 số
      if (raw.length >= 4) {
        formatted += "-" + numbers;
      }
      // Nếu chỉ mới nhập 3 ký tự đầu → chưa thêm gạch ngang (tránh hiện - sớm)
      // Nếu nhập ít hơn 3 → chỉ hiện những gì đã nhập
    }

    // Gán lại giá trị đã format vào input
    plate.value = formatted;

    // Xóa trạng thái cũ
    removeStatus(plate.parentElement);

    // Regex kiểm tra định dạng hợp lệ: 2 số + 1 chữ - 4 hoặc 5 số
    // Ví dụ: 51F-02849 hoặc 51F-2849
    const platePattern = /^[0-9]{2}[A-Z]-[0-9]{4,5}$/;

    if (platePattern.test(formatted)) {
      setSuccess(plate.parentElement);
    } else if (formatted.length > 0) {
      setError(plate.parentElement);
    }
  });

  // Submit
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    errorMessage.textContent = "";

    // Validate based on mode
    if (currentMode === "new") {
      fullname.dispatchEvent(new Event("input"));
      phone.dispatchEvent(new Event("input"));
    }
    plate.dispatchEvent(new Event("input"));

    const errorGroup = document.querySelector(".input-group.error");
    if (errorGroup) {
      errorGroup.querySelector("input").focus();
      return;
    }

    isSubmitting = true;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang xử lý...`;

    grecaptcha.ready(() => {
      grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action: "vision_register" })
        .then((token) => {
          const data = {
            key: PUBLIC_KEY,
            recaptchaToken: token,
            mode: currentMode,
            name: currentMode === "new" ? fullname.value.trim() : "",
            phone: currentMode === "new" ? phone.value.replace(/\s/g, "") : "",
            plate: plate.value.toUpperCase(),
            timestamp: new Date().toLocaleString("vi-VN"),
          };

          fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
            .then(() => {
              if (currentMode === "existing") {
                // Hiển thị popup với loading ngay
                popup.style.display = "flex";
                popupMessage.innerHTML = `
                  <i class="fas fa-spinner fa-spin"></i> Đang cập nhật...
                `;

                // Fetch số liệu thật từ server
                fetch(
                  `${APPS_SCRIPT_URL}?plate=${encodeURIComponent(plate.value)}`
                )
                  .then((res) => res.json())
                  .then((data) => {
                    if (!data || data.error) {
                      popupMessage.textContent = "✅ Cập nhật thành công!";
                      return;
                    }

                    // Lưu số liệu mới
                    optimisticTotal = data.total;
                    optimisticMonthly = data.monthly;

                    // Hiển thị kết quả thật
                    popupMessage.innerHTML = `
                      ✅ Cập nhật thành công!<br><br>
                      🔋 Tổng lần sạc: <b>${data.total}</b><br>
                      📆 Tháng này: <b>${data.monthly}</b>
                    `;
                  })
                  .catch(() => {
                    popupMessage.textContent =
                      "✅ Đã ghi nhận, dữ liệu đang đồng bộ!";
                  });
              } else {
                // Mode "new" - đăng ký mới
                popup.style.display = "flex";
                popupMessage.textContent =
                  "Đăng ký thành công. Chúng tôi sẽ liên hệ ngay!";
              }

              form.reset();
              [fullnameGroup, phoneGroup, plate.parentElement].forEach(
                removeStatus
              );
            })
            .catch((err) => {
              errorMessage.textContent =
                err.message || "Lỗi kết nối, thử lại sau!";
            })
            .finally(() => {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML =
                currentMode === "new"
                  ? `ĐĂNG KÝ NGAY <i class="fas fa-arrow-right"></i>`
                  : `CẬP NHẬT LẦN SẠC <i class="fas fa-arrow-right"></i>`;
              isSubmitting = false;
            });
        });
    });
  });

  // Đóng popup
  document.getElementById("closePopup").addEventListener("click", () => {
    popup.style.display = "none";
  });
});

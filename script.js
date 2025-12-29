// ==================== VISION ENERGY STATION – WITH REALTIME VALIDATION ====================
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
  let currentMode = "new";
  let plateCheckTimeout = null;
  let lastCheckedPlate = "";

  // === CẤU HÌNH ===
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwtwej6RTx9waMfZ55XUG-zmYpsQjgOZ4Ft2zuVMSz5ACoJ13WnVOfPEa0hfFX0I9zLsA/exec";
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
        btnSubmit.innerHTML = `XÁC NHẬN NGAY <i class="fas fa-arrow-right"></i>`;
      }

      form.reset();
      errorMessage.textContent = "";
      lastCheckedPlate = "";
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

  // ==================== VALIDATE BIỂN SỐ REALTIME (JSONP) ====================
  async function checkPlateExists(plateValue) {
    return new Promise((resolve) => {
      const callbackName = "jsonpCallback_" + Date.now();
      const script = document.createElement("script");

      window[callbackName] = function (data) {
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };

      script.src = `${APPS_SCRIPT_URL}?plate=${encodeURIComponent(
        plateValue
      )}&callback=${callbackName}`;
      script.onerror = () => {
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(null);
      };

      document.body.appendChild(script);

      // Timeout sau 5s
      setTimeout(() => {
        if (window[callbackName]) {
          delete window[callbackName];
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
          resolve(null);
        }
      }, 5000);
    });
  }

  // Validate Họ tên
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

  // Validate Số điện thoại - GIỮ SỐ 0 ĐẦU TIÊN
  phone.addEventListener("input", () => {
    // Lấy chỉ số, loại bỏ tất cả ký tự không phải số
    let digits = phone.value.replace(/\D/g, "");

    // Đảm bảo luôn bắt đầu bằng số 0
    if (digits.length > 0 && digits.charAt(0) !== "0") {
      digits = "0" + digits;
    }

    // Giới hạn độ dài (tối đa 11 số bao gồm số 0 đầu)
    digits = digits.slice(0, 11);

    // Format hiển thị
    if (digits.length > 0) {
      if (digits.length <= 4) {
        phone.value = digits;
      } else if (digits.length <= 7) {
        phone.value = digits.replace(/(\d{4})(\d{0,3})/, "$1 $2");
      } else if (digits.length <= 10) {
        phone.value = digits.replace(/(\d{4})(\d{3})(\d{0,3})/, "$1 $2 $3");
      } else {
        phone.value = digits.replace(/(\d{4})(\d{3})(\d{0,4})/, "$1 $2 $3");
      }
    } else {
      phone.value = digits;
    }

    // Di chuyển cursor đến cuối
    phone.selectionStart = phone.selectionEnd = phone.value.length;

    // Validate
    removeStatus(phoneGroup);
    if (!digits) return;

    // Regex cho số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)
    const phoneRegex = /^0[3-9]\d{8,9}$/;
    if (phoneRegex.test(digits)) {
      setSuccess(phoneGroup);
    } else {
      setError(phoneGroup);
    }
  });

  // Validate Biển số - GIỮ SỐ 0
  plate.addEventListener("input", () => {
    // Lấy giá trị, chuyển thành chữ hoa
    let raw = plate.value.toUpperCase();

    // Chỉ cho phép chữ cái, số và dấu -
    raw = raw.replace(/[^A-Z0-9\-]/g, "");

    // Giữ nguyên format 00A-00000
    let formatted = raw;

    // Nếu có quá 3 ký tự và chưa có dấu -, thêm vào sau 3 ký tự đầu
    if (raw.length > 3 && !raw.includes("-")) {
      const prefix = raw.substring(0, 3);
      const suffix = raw.substring(3).replace(/\D/g, ""); // Chỉ lấy số
      formatted = prefix + "-" + suffix;
    }

    // Giới hạn độ dài
    if (formatted.length > 9) {
      formatted = formatted.substring(0, 9);
    }

    plate.value = formatted;
    removeStatus(plate.parentElement);
    errorMessage.textContent = "";

    // Pattern cho biển số: 00A-00000 hoặc 00A-0000
    const platePattern = /^[0-9]{2}[A-Z]-[0-9]{4,5}$/;

    if (platePattern.test(formatted)) {
      setSuccess(plate.parentElement);

      // Debounce check plate exists
      clearTimeout(plateCheckTimeout);
      plateCheckTimeout = setTimeout(async () => {
        if (formatted === lastCheckedPlate) return;
        lastCheckedPlate = formatted;

        const checkResult = await checkPlateExists(formatted);

        if (checkResult && !checkResult.error) {
          if (currentMode === "new" && checkResult.exists) {
            // Người mới nhưng biển số đã tồn tại
            setError(plate.parentElement);
            errorMessage.innerHTML = `
              <i class="fas fa-exclamation-triangle"></i> 
              Biển số đã tồn tại! Vui lòng chọn <strong>"Thành viên cũ"</strong>
            `;
          } else if (currentMode === "existing" && !checkResult.exists) {
            // Thành viên cũ nhưng biển số chưa có
            setError(plate.parentElement);
            errorMessage.innerHTML = `
              <i class="fas fa-exclamation-triangle"></i> 
              Biển số chưa đăng ký! Vui lòng chọn <strong>"Người mới"</strong>
            `;
          } else {
            // Hợp lệ
            errorMessage.textContent = "";
            setSuccess(plate.parentElement);

            // Hiển thị thông tin nếu là thành viên cũ
            if (currentMode === "existing" && checkResult.exists) {
              errorMessage.innerHTML = `
                <i class="fas fa-check-circle" style="color: #7ac143;"></i> 
                Xin chào <strong>${checkResult.name}</strong>! 
                Bạn đã sạc <strong>${checkResult.total}</strong> lần.
              `;
              errorMessage.style.color = "#7ac143";
            }
          }
        }
      }, 800);
    } else if (formatted.length > 0) {
      setError(plate.parentElement);
      errorMessage.textContent = "";
    }
  });

  // Submit form
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    // Clear previous error
    errorMessage.textContent = "";
    errorMessage.style.color = "#e63946";

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
          // Chuẩn bị dữ liệu
          const phoneValue = phone.value.replace(/\s/g, "");
          const plateValue = plate.value.toUpperCase();

          const data = {
            key: PUBLIC_KEY,
            recaptchaToken: token,
            mode: currentMode,
            name: currentMode === "new" ? fullname.value.trim() : "",
            phone: currentMode === "new" ? phoneValue : "",
            plate: plateValue,
            timestamp: new Date().toLocaleString("vi-VN"),
          };

          fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(data),
            redirect: "follow",
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              return res.json();
            })
            .then((result) => {
              // DEBUG: Log kết quả để kiểm tra
              console.log("Server response:", result);

              if (result.status === "error" || !result.success) {
                throw new Error(result.message || "Có lỗi xảy ra");
              }

              if (currentMode === "existing") {
                popup.style.display = "flex";
                // SỬA LẠI POPUP - SỬ DỤNG result.total VÀ result.monthly
                popupMessage.innerHTML = `
                  <div style="text-align: center;">
                    <div style="font-size: 24px; color: #7ac143; margin-bottom: 15px;">
                      <i class="fas fa-check-circle"></i> CHECK-IN THÀNH CÔNG!
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <div style="font-size: 18px; margin-bottom: 10px;">Xin chào <strong style="color: #2c3e50;">${
                        result.name || "Quý khách"
                      }</strong>!</div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>🔋 Tổng lần sạc:</span>
                        <strong style="color: #e74c3c; font-size: 20px;">${
                          result.total || 0
                        }</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span>📆 Tháng này:</span>
                        <strong style="color: #3498db; font-size: 20px;">${
                          result.monthly || 0
                        }</strong>
                      </div>
                    </div>
                    <div style="color: #666; font-size: 14px; margin-top: 10px;">
                      Cảm ơn bạn đã sử dụng dịch vụ của Vision Energy!
                    </div>
                  </div>
                `;
              } else {
                popup.style.display = "flex";
                popupMessage.innerHTML = `
                  <div style="text-align: center;">
                    <div style="font-size: 24px; color: #7ac143; margin-bottom: 15px;">
                      <i class="fas fa-check-circle"></i> ĐĂNG KÝ THÀNH CÔNG!
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <div style="margin-bottom: 10px;">Cảm ơn bạn đã đăng ký!</div>
                    </div>
                  </div>
                `;
              }

              // Reset form
              form.reset();
              lastCheckedPlate = "";
              [fullnameGroup, phoneGroup, plate.parentElement].forEach(
                removeStatus
              );

              // Reset mode về "new" sau 3 giây
              setTimeout(() => {
                if (currentMode === "existing") {
                  const newModeBtn = document.querySelector(
                    '.mode-btn[data-mode="new"]'
                  );
                  if (newModeBtn) {
                    newModeBtn.click();
                  }
                }
              }, 3000);
            })
            .catch((err) => {
              console.error("Submit error:", err);
              errorMessage.textContent =
                err.message || "Lỗi kết nối, thử lại sau!";
            })
            .finally(() => {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML =
                currentMode === "new"
                  ? `ĐĂNG KÝ NGAY <i class="fas fa-arrow-right"></i>`
                  : `XÁC NHẬN NGAY <i class="fas fa-arrow-right"></i>`;
              isSubmitting = false;
            });
        })
        .catch((err) => {
          console.error("reCAPTCHA error:", err);
          errorMessage.textContent = "Lỗi xác thực reCAPTCHA!";
          btnSubmit.disabled = false;
          btnSubmit.innerHTML =
            currentMode === "new"
              ? `ĐĂNG KÝ NGAY <i class="fas fa-arrow-right"></i>`
              : `XÁC NHẬN NGAY <i class="fas fa-arrow-right"></i>`;
          isSubmitting = false;
        });
    });
  });

  // Đóng popup
  document.getElementById("closePopup").addEventListener("click", () => {
    popup.style.display = "none";
  });

  // Đóng popup khi click bên ngoài
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
    }
  });
});

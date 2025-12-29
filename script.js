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
  let optimisticTotal = null;
  let optimisticMonthly = null;
  let plateCheckTimeout = null;
  let lastCheckedPlate = "";

  // === CẤU HÌNH ===
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzR763Gv_mSHSciBlxrDZHQ1c-AlfBEGf1akPbP-E7lvTv0gFXwcioeAogEohbCIyZFsA/exec";
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
    let raw = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let formatted = "";

    if (raw.length > 0) {
      let prefix = raw.slice(0, 3);
      let numbers = raw.slice(3, 8);
      formatted = prefix;
      if (raw.length >= 4) {
        formatted += "-" + numbers;
      }
    }

    plate.value = formatted;
    removeStatus(plate.parentElement);
    errorMessage.textContent = "";

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
      }, 800); // Đợi 800ms sau khi ngừng gõ
    } else if (formatted.length > 0) {
      setError(plate.parentElement);
      errorMessage.textContent = "";
    }
  });

  // Submit
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.status === "error") {
                throw new Error(result.message);
              }

              if (currentMode === "existing") {
                popup.style.display = "flex";
                popupMessage.innerHTML = `
                  ✅ Cập nhật thành công!<br><br>
                  🔋 Tổng lần sạc: <b>${result.total}</b><br>
                  📆 Tháng này: <b>${result.monthly}</b>
                `;
              } else {
                popup.style.display = "flex";
                popupMessage.textContent =
                  "Đăng ký thành công. Chúng tôi sẽ liên hệ ngay!";
              }

              form.reset();
              lastCheckedPlate = "";
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
                  : `XÁC NHẬN NGAY <i class="fas fa-arrow-right"></i>`;
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

import { signInWithEmail, signInWithGoogle, signUpBusiness } from "../api/auth.js";
import { createToastContainer } from "../components/ui.js";
import { toast, validateEmail } from "../lib/utils.js";
import { getSession } from "../lib/supabase.js";
import { getMyProfile } from "../api/auth.js";
import { navigateTo } from "../lib/routes.js";

function toggleForms(type) {
  const isLogin = type === "login";
  document.getElementById("loginForm").classList.toggle("hidden", !isLogin);
  document.getElementById("registerForm").classList.toggle("hidden", isLogin);
  document.getElementById("switchLogin").classList.toggle("bg-amber-200", isLogin);
  document.getElementById("switchRegister").classList.toggle("bg-amber-200", !isLogin);
}

async function onLoginSubmit(e) {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const email = form.get("email");
  const password = form.get("password");

  if (!validateEmail(email)) return toast("بريد إلكتروني غير صحيح", "error");

  try {
    await signInWithEmail({ email, password });
    toast("تم تسجيل الدخول بنجاح", "success");
    setTimeout(() => navigateTo("index.html"), 700);
  } catch (err) {
    toast(err.message || "فشل تسجيل الدخول", "error");
  }
}

async function onRegisterSubmit(e) {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const name = form.get("name");
  const email = form.get("email");
  const password = form.get("password");

  if (String(password).length < 6) return toast("كلمة المرور 6 أحرف على الأقل", "error");
  try {
    await signUpBusiness({ name, email, password });
    toast("تم إنشاء الحساب. تحقق من بريدك الإلكتروني للتفعيل", "success");
    toggleForms("login");
  } catch (err) {
    toast(err.message || "تعذر إنشاء الحساب", "error");
  }
}

function init() {
  createToastContainer();
  document.getElementById("switchLogin").addEventListener("click", () => toggleForms("login"));
  document.getElementById("switchRegister").addEventListener("click", () => toggleForms("register"));

  document.getElementById("loginForm").addEventListener("submit", onLoginSubmit);
  document.getElementById("registerForm").addEventListener("submit", onRegisterSubmit);

  document.getElementById("googleLogin").addEventListener("click", async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast(err.message || "تعذر تسجيل الدخول عبر Google", "error");
    }
  });
}

async function initWithGuard() {
  const session = await getSession();
  if (session) {
    const profile = await getMyProfile();
    if (profile?.role === "business") {
      navigateTo("dashboard.html");
      return;
    }
    navigateTo("index.html");
    return;
  }

  init();
}

initWithGuard();

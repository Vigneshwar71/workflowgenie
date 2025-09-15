const screens = ["welcome","auth","firstTime","consent","notify","success"]; 
function show(id){
  screens.forEach(s=>document.getElementById(s).classList.remove("active"));
  document.getElementById(id).classList.add("active");
  speakVisibleText();
}

// Simple i18n dictionary
const i18n = {
  en: {
    tagline:"Your Digital Health Companion",
    language:"Language",
    help:"Help",
    welcome:"Welcome! JeevanSetu – Your Digital Health Companion",
    privacy_note:"Your records are private and never shared without your consent.",
    login_aadhaar:"Login with Aadhaar",
    login_mobile:"Login with Mobile Number",
    continue_language:"Continue in your language",
    verify_identity:"Verify your identity",
    enter_aadhaar:"Enter Aadhaar Number",
    aadhaar_privacy:"Used only to verify you. We do not store your number.",
    send_otp:"Send OTP",
    enter_mobile:"Enter Mobile Number",
    enter_otp:"Enter OTP",
    verify:"Verify",
    back:"Back",
    create_or_retrieve:"Create new Health ID or continue",
    create_new:"Create New Health ID",
    retrieve_existing:"Retrieve Existing Record",
    name:"Name",
    age:"Age",
    sex:"Sex",
    male:"Male",
    female:"Female",
    other:"Other",
    home_state:"Home State",
    occupation:"Occupation",
    photo:"Profile photo (optional)",
    continue:"Continue",
    you_control:"You control your data",
    secure:"Your health data is secure.",
    access:"Only you and authorized doctors can see it.",
    alerts:"You receive an alert whenever your data is accessed.",
    agree:"I Agree",
    allow_notifications:"Allow notifications to stay updated about your health!",
    notif_example:"You have a check-up tomorrow—tap to confirm!",
    enable:"Enable",
    success_created:"Success! Your JeevanSetu Health ID has been created.",
    no_reminders:"You have no current reminders.",
    simulate_notif:"Simulate notification",
    start_using:"Start using JeevanSetu",
    why_js:"Why JeevanSetu?",
    motivate:"Your health journey starts here. Safe, connected, and fair healthcare—anywhere you go!",
    need_help:"Need help?",
    help_text:"Tap call to connect with a health worker, or chat with our assistant.",
    call:"Call", chat:"Chat", close:"Close", ok:"OK",
    aadhaar_tip:"Aadhaar helps verify your identity securely via OTP.",
    mobile_tip:"Use your phone if Aadhaar is not handy. We'll verify via OTP.",
  },
  hi: {
    tagline:"आपका डिजिटल स्वास्थ्य साथी",
    language:"भाषा",
    help:"मदद",
    welcome:"स्वागत है! जीवनसेतु – आपका डिजिटल स्वास्थ्य साथी",
    privacy_note:"आपके रिकॉर्ड निजी हैं और आपकी अनुमति के बिना साझा नहीं किए जाते।",
    login_aadhaar:"आधार से लॉगिन",
    login_mobile:"मोबाइल नंबर से लॉगिन",
    continue_language:"अपनी भाषा में जारी रखें",
    verify_identity:"अपनी पहचान सत्यापित करें",
    enter_aadhaar:"आधार नंबर दर्ज करें",
    aadhaar_privacy:"केवल सत्यापन हेतु, हम आपका नंबर संग्रहीत नहीं करते।",
    send_otp:"ओटीपी भेजें",
    enter_mobile:"मोबाइल नंबर दर्ज करें",
    enter_otp:"ओटीपी दर्ज करें",
    verify:"सत्यापित करें",
    back:"वापस",
    create_or_retrieve:"नया हेल्थ आईडी बनाएं या जारी रखें",
    create_new:"नया हेल्थ आईडी बनाएं",
    retrieve_existing:"मौजूदा रिकॉर्ड प्राप्त करें",
    name:"नाम",
    age:"आयु",
    sex:"लिंग",
    male:"पुरुष",
    female:"महिला",
    other:"अन्य",
    home_state:"मूल राज्य",
    occupation:"पेशा",
    photo:"प्रोफाइल फोटो (वैकल्पिक)",
    continue:"जारी रखें",
    you_control:"डेटा पर आपका नियंत्रण है",
    secure:"आपका स्वास्थ्य डेटा सुरक्षित है।",
    access:"केवल आप और अधिकृत डॉक्टर देख सकते हैं।",
    alerts:"जब भी आपका डेटा एक्सेस हो, आपको सूचना मिलेगी।",
    agree:"मैं सहमत हूँ",
    allow_notifications:"अपडेट रहने के लिए सूचनाएँ अनुमति दें!",
    notif_example:"कल आपकी जांच है—पुष्टि के लिए टैप करें!",
    enable:"सक्रिय करें",
    success_created:"सफलता! आपका जीवनसेतु हेल्थ आईडी बन गया है।",
    no_reminders:"कोई रिमाइंडर नहीं है।",
    simulate_notif:"सूचना का प्रदर्शन करें",
    start_using:"जीवनसेतु उपयोग शुरू करें",
    why_js:"क्यों जीवनसेतु?",
    motivate:"आपकी स्वास्थ्य यात्रा यहीं से शुरू होती है—सुरक्षित, जुड़ी और न्यायपूर्ण।",
    need_help:"मदद चाहिए?",
    help_text:"कॉल पर स्वास्थ्य कर्मी से जुड़ें, या सहायक से चैट करें।",
    call:"कॉल", chat:"चैट", close:"बंद करें", ok:"ठीक है",
    aadhaar_tip:"आधार से सुरक्षित ओटीपी के माध्यम से पहचान सत्यापित होती है।",
    mobile_tip:"यदि आधार उपलब्ध नहीं, मोबाइल से ओटीपी द्वारा सत्यापन करें।",
  },
  ml: {
    tagline:"നിങ്ങളുടെ ഡിജിറ്റൽ ഹെൽത്ത് കൂട്ടായി",
    language:"ഭാഷ",
    help:"സഹായം",
    welcome:"സ്വാഗതം! ജീവിതസേതു – നിങ്ങളുടെ ഡിജിറ്റൽ ഹെൽത്ത് കൂട്ടായി",
    privacy_note:"നിങ്ങളുടെ രേഖകൾ സ്വകാര്യമാണ്; നിങ്ങളുടെ സമ്മതമില്ലാതെ പങ്കിടില്ല.",
    login_aadhaar:"ആധാറിലൂടെ ലോഗിൻ",
    login_mobile:"മൊബൈൽ നമ്പർ ലോഗിൻ",
    continue_language:"നിങ്ങളുടെ ഭാഷയിൽ തുടരുക",
    verify_identity:"നിങ്ങളുടെ തിരിച്ചറിവ് പരിശോധിക്കുക",
    enter_aadhaar:"ആധാർ നമ്പർ നൽകുക",
    aadhaar_privacy:"പരിശോധനയ്ക്ക് മാത്രം; ഞങ്ങൾ നമ്പർ സൂക്ഷിക്കില്ല.",
    send_otp:"ഒടിപി അയക്കുക",
    enter_mobile:"മൊബൈൽ നമ്പർ നൽകുക",
    enter_otp:"ഒടിപി നൽകുക",
    verify:"സ്ഥിരീകരിക്കുക",
    back:"തിരികെ",
    create_or_retrieve:"പുതിയ ഹെൽത്ത് ഐഡി സൃഷ്ടിക്കുക അല്ലെങ്കിൽ തുടരുക",
    create_new:"പുതിയ ഹെൽത്ത് ഐഡി",
    retrieve_existing:"നിലവിലെ രേഖ",
    name:"പേര്",
    age:"വയസ്",
    sex:"ലിംഗം",
    male:"പുരുഷൻ",
    female:"സ്ത്രീ",
    other:"മറ്റുള്ളവർ",
    home_state:"സ്വദേശം",
    occupation:"തൊഴിൽ",
    photo:"പ്രൊഫൈൽ ഫോട്ടോ (ഐച്ഛികം)",
    continue:"തുടരുക",
    you_control:"ഡാറ്റയിൽ നിയന്ത്രണം നിങ്ങളുടേതാണ്",
    secure:"നിങ്ങളുടെ ഹെൽത്ത് ഡാറ്റ സുരക്ഷിതമാണ്.",
    access:"നിങ്ങളും അധികാരപ്പെട്ട ഡോക്ടർമാരും മാത്രം കാണാം.",
    alerts:"ഡാറ്റ ആക്സസ് ചെയ്താൽ അറിയിപ്പ് ലഭിക്കും.",
    agree:"എനിക്ക് സമ്മതമാണ്",
    allow_notifications:"ആരോഗ്യ അപ്‌ഡേറ്റുകൾക്കായി അറിയിപ്പുകൾ അനുവദിക്കുക!",
    notif_example:"നാളെ നിങ്ങളുടെ ചെക്‌അപ്പ് – സ്ഥിരീകരിക്കാൻ ടാപ്പ് ചെയ്യുക!",
    enable:"സജ്ജമാക്കുക",
    success_created:"വിജയം! നിങ്ങളുടെ ജീവിതസേതു ഹെൽത്ത് ഐഡി സൃഷ്ടിച്ചു.",
    no_reminders:"ഇപ്പോൾ റിമൈൻഡറുകളില്ല.",
    simulate_notif:"അറിയിപ്പ് സിമുലേറ്റ് ചെയ്യുക",
    start_using:"ജീവിതസേതു ഉപയോഗം തുടങ്ങുക",
    why_js:"ജീവിതസേതു എന്തിന്?",
    motivate:"നിങ്ങളുടെ ആരോഗ്യയാത്ര ഇവിടെ ആരംഭിക്കുന്നു—സുരക്ഷിതം, ബന്ധിപ്പിച്ച, നീതിയുള്ളത്.",
    need_help:"സഹായം വേണോ?",
    help_text:"കോളിലൂടെ ഹെൽത്ത് വർക്കറുമായി ബന്ധപ്പെടുക, അല്ലെങ്കിൽ ചാറ്റ് ചെയ്യുക.",
    call:"കോൾ", chat:"ചാറ്റ്", close:"അടയ്‌ക്കുക", ok:"ശരി",
    aadhaar_tip:"ആധാർ ഒടിപി വഴി സുരക്ഷിത തിരിച്ചറിയൽ.",
    mobile_tip:"ആധാർ ഇല്ലെങ്കിൽ മൊബൈൽ ഒടിപി ഉപയോഗിക്കുക.",
  },
  bn: {
    tagline:"আপনার ডিজিটাল হেলথ সাথী",
    language:"ভাষা",
    help:"সহায়তা",
    welcome:"স্বাগতম! জীবনসেতু – আপনার ডিজিটাল হেলথ সাথী",
    privacy_note:"আপনার রেকর্ড ব্যক্তিগত; আপনার সম্মতি ছাড়া শেয়ার হয় না।",
    login_aadhaar:"আধারের মাধ্যমে লগইন",
    login_mobile:"মোবাইল নম্বর দিয়ে লগইন",
    continue_language:"নিজের ভাষায় চালিয়ে যান",
    verify_identity:"আপনার পরিচয় যাচাই করুন",
    enter_aadhaar:"আধার নম্বর দিন",
    aadhaar_privacy:"শুধু যাচাইয়ের জন্য; আমরা নম্বর সংরক্ষণ করি না।",
    send_otp:"ওটিপি পাঠান",
    enter_mobile:"মোবাইল নম্বর দিন",
    enter_otp:"ওটিপি দিন",
    verify:"যাচাই করুন",
    back:"ফিরে যান",
    create_or_retrieve:"নতুন হেলথ আইডি তৈরি করুন বা চালিয়ে যান",
    create_new:"নতুন হেলথ আইডি",
    retrieve_existing:"বর্তমান রেকর্ড",
    name:"নাম",
    age:"বয়স",
    sex:"লিঙ্গ",
    male:"পুরুষ",
    female:"মহিলা",
    other:"অন্যান্য",
    home_state:"নিজ রাজ্য",
    occupation:"পেশা",
    photo:"প্রোফাইল ছবি (ঐচ্ছিক)",
    continue:"চালিয়ে যান",
    you_control:"ডেটার নিয়ন্ত্রণ আপনার হাতে",
    secure:"আপনার হেলথ ডেটা সুরক্ষিত।",
    access:"শুধু আপনি ও অনুমোদিত ডাক্তাররা দেখতে পারবেন।",
    alerts:"ডেটা অ্যাক্সেস হলেই আপনি জানবেন।",
    agree:"রাজি",
    allow_notifications:"আপডেট পেতে নোটিফিকেশন অনুমতি দিন!",
    notif_example:"আগামীকাল আপনার চেক-আপ—নিশ্চিত করতে ট্যাপ করুন!",
    enable:"সক্রিয় করুন",
    success_created:"সফল! আপনার জীবনসেতু হেলথ আইডি তৈরি হয়েছে।",
    no_reminders:"এখন কোনো রিমাইন্ডার নেই।",
    simulate_notif:"নোটিফিকেশন দেখান",
    start_using:"জীবনসেতু ব্যবহার শুরু করুন",
    why_js:"কেন জীবনসেতু?",
    motivate:"আপনার হেলথ যাত্রা এখানেই শুরু—নিরাপদ, সংযুক্ত, ন্যায়সংগত।",
    need_help:"সহায়তা লাগবে?",
    help_text:"কল করে হেলথ ওয়ার্কারের সাথে যুক্ত হন, বা চ্যাট করুন।",
    call:"কল", chat:"চ্যাট", close:"বন্ধ", ok:"ঠিক আছে",
    aadhaar_tip:"আধার ওটিপি দিয়ে নিরাপদ পরিচয় যাচাই।",
    mobile_tip:"আধার না থাকলে মোবাইল ওটিপি ব্যবহার করুন।",
  }
};

let currentLang = localStorage.getItem("lang") || "en";
const t = (k)=> (i18n[currentLang] && i18n[currentLang][k]) || i18n.en[k] || k;

function applyI18n(){
  document.querySelectorAll(".i18n").forEach(node=>{
    const key = node.getAttribute("data-key");
    if(!key) return;
    if(node.tagName === 'INPUT' || node.tagName === 'TEXTAREA'){
      node.setAttribute('placeholder', t(key));
    } else {
      node.textContent = t(key);
    }
  });
}

function initLang(){
  const sel = document.getElementById('lang');
  sel.value = currentLang;
  sel.addEventListener('change', ()=>{
    currentLang = sel.value;
    localStorage.setItem('lang', currentLang);
    applyI18n();
    speakVisibleText();
  });
  applyI18n();
}

// Tooltips
const tips = {
  aadhaar_tip: () => t('aadhaar_tip'),
  mobile_tip: () => t('mobile_tip')
};

function setupTips(){
  document.querySelectorAll('.tip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.getAttribute('data-tip-key');
      document.getElementById('tipText').textContent = tips[key]();
      document.getElementById('tipDialog').showModal();
    });
  });
  document.querySelectorAll('dialog [data-close]').forEach(b=>{
    b.addEventListener('click', e=> e.target.closest('dialog').close());
  });
}

// Auth simulation
let authMode = 'aadhaar';
function setupAuth(){
  document.getElementById('aadhaarBtn').addEventListener('click', ()=>{
    authMode = 'aadhaar';
    document.getElementById('authAadhaar').classList.remove('hidden');
    document.getElementById('authMobile').classList.add('hidden');
    show('auth');
  });
  document.getElementById('mobileBtn').addEventListener('click', ()=>{
    authMode = 'mobile';
    document.getElementById('authAadhaar').classList.add('hidden');
    document.getElementById('authMobile').classList.remove('hidden');
    show('auth');
  });
  document.getElementById('sendOtpA').addEventListener('click', ()=>{
    document.getElementById('otpBlock').classList.remove('hidden');
    speak(t('enter_otp'));
  });
  document.getElementById('sendOtpM').addEventListener('click', ()=>{
    document.getElementById('otpBlock').classList.remove('hidden');
    speak(t('enter_otp'));
  });
  document.getElementById('verifyOtp').addEventListener('click', ()=>{
    const otp = document.getElementById('otpInput').value.trim();
    const err = document.getElementById('authError');
    if(otp.length !== 6){
      err.style.display = 'block';
      err.textContent = currentLang==='hi' ? 'अमान्य ओटीपी। फिर से कोशिश करें!' : currentLang==='ml' ? 'അസാധുവായ ഒടിപി. വീണ്ടും ശ്രമിക്കുക!' : currentLang==='bn' ? 'অবৈধ ওটিপি। আবার চেষ্টা করুন!' : 'Invalid OTP. Try again!';
      return;
    }
    err.style.display = 'none';
    show('firstTime');
    document.getElementById('progressBar').style.width = '33%';
  });
  document.querySelectorAll('#auth .nav [data-nav="back"]').forEach(b=>b.addEventListener('click', ()=> show('welcome')));
}

function setupFirstTime(){
  document.getElementById('newId').addEventListener('click', ()=>{
    document.getElementById('miniForm').scrollIntoView({behavior:'smooth'});
  });
  document.getElementById('existingId').addEventListener('click', ()=>{
    // For demo, behave same as new
    document.getElementById('miniForm').scrollIntoView({behavior:'smooth'});
  });
  document.getElementById('toConsent').addEventListener('click', ()=>{
    document.getElementById('progressBar').style.width = '66%';
    show('consent');
  });
  document.querySelectorAll('#firstTime .nav [data-nav="back"]').forEach(b=>b.addEventListener('click', ()=> show('auth')));
}

function setupConsent(){
  document.getElementById('agree').addEventListener('click', ()=>{
    show('notify');
  });
  document.querySelectorAll('#consent .nav [data-nav="back"]').forEach(b=>b.addEventListener('click', ()=> show('firstTime')));
}

// Notifications (simulated)
function setupNotify(){
  document.getElementById('enableNotify').addEventListener('click', async ()=>{
    try{
      if('Notification' in window && Notification.requestPermission){
        await Notification.requestPermission();
      }
    }catch(_){}
    show('success');
    drawQr();
    fillCard();
  });
}

function drawQr(){
  const c = document.getElementById('qr');
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0,0,120,120);
  ctx.fillStyle = '#fff';
  for(let y=10;y<120;y+=20){
    for(let x=10;x<120;x+=20){
      if((x+y)%40===0) ctx.fillRect(x,y,10,10);
    }
  }
}

function fillCard(){
  const name = document.getElementById('name').value || 'User';
  const id = 'JS-' + Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
  document.getElementById('hcName').textContent = name;
  document.getElementById('hcId').textContent = id;
}

function setupSuccess(){
  document.getElementById('simulateReminder').addEventListener('click', ()=>{
    pushDemoNotification();
  });
  document.getElementById('startUsing').addEventListener('click', ()=>{
    alert(t('start_using'));
  });
}

function pushDemoNotification(){
  const msg = t('notif_example');
  if('Notification' in window && Notification.permission === 'granted'){
    new Notification('JeevanSetu', { body: msg });
  } else {
    // In-page banner fallback
    const el = document.createElement('div');
    el.className = 'preview notif';
    el.textContent = '🔔 ' + msg;
    document.getElementById('success').appendChild(el);
    setTimeout(()=> el.remove(), 4000);
  }
}

// Help dialog
function setupHelp(){
  const helpBtn = document.getElementById('helpBtn');
  const helpDialog = document.getElementById('helpDialog');
  helpBtn.addEventListener('click', ()=> helpDialog.showModal());
}

// TTS
let ttsOn = false;
function speak(text){
  if(!ttsOn) return;
  try{
    const u = new SpeechSynthesisUtterance(text);
    // Attempt language hint
    u.lang = currentLang==='hi' ? 'hi-IN' : currentLang==='ml' ? 'ml-IN' : currentLang==='bn' ? 'bn-IN' : 'en-US';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }catch(_){/* ignore */}
}
function speakVisibleText(){
  const active = document.querySelector('.card.active');
  if(!active) return;
  const chunks = [];
  active.querySelectorAll('h1,h2,label,button,.sub,.cta,.notif,.bullets li').forEach(n=>{
    if(n.offsetParent !== null) chunks.push(n.textContent.trim());
  });
  if(chunks.length) speak(chunks.join('\n'));
}
function setupTTS(){
  const btn = document.getElementById('ttsToggle');
  btn.addEventListener('click', ()=>{
    ttsOn = !ttsOn;
    btn.setAttribute('aria-pressed', String(ttsOn));
    if(ttsOn) speakVisibleText(); else speechSynthesis.cancel();
  });
}

// Back buttons generic
function setupBacks(){
  document.querySelectorAll('[data-nav="back"]').forEach(btn=>{
    btn.addEventListener('click', ()=> window.history.back());
  });
}

// Why JS link
function setupWhy(){
  document.getElementById('why').addEventListener('click', ()=>{
    alert('30s explainer video would play here.');
  });
}

// Init
window.addEventListener('DOMContentLoaded', ()=>{
  initLang();
  setupTips();
  setupAuth();
  setupFirstTime();
  setupConsent();
  setupNotify();
  setupSuccess();
  setupHelp();
  setupTTS();
  setupBacks();
  setupWhy();
});


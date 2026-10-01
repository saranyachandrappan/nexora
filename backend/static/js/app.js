const { useState, useEffect, useRef, useCallback } = React;

// ============================================================
//  GLASSMORPHISM LOGIN PAGE
// ============================================================
const DEMO_CREDENTIALS = [
  { role: 'student',  label: 'Student',      username: 'student',  password: 'aec2026',   badge: '🎓', color: '#6366f1' },
  { role: 'staff',    label: 'Faculty/Staff', username: 'faculty',  password: 'aecstaff',  badge: '👨‍🏫', color: '#8b5cf6' },
  { role: 'admin',    label: 'Administrator', username: 'admin',    password: 'aecadmin',  badge: '🛡️', color: '#f59e0b' },
];

function LoginPage({ onLogin }) {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPass,  setShowPass]      = useState(false);
  const [error,     setError]         = useState('');
  const [loading,   setLoading]       = useState(false);
  const [activeRole, setActiveRole]   = useState('student');
  const [shake,     setShake]         = useState(false);
  const [view,      setView]          = useState('login');
  const [fpEmail,   setFpEmail]       = useState('');
  const [fpError,   setFpError]       = useState('');
  const [fpLoading, setFpLoading]     = useState(false);
  const [focusedInput, setFocusedInput] = useState('');
  
  // Register Form State
  const [regName,        setRegName]        = useState('');
  const [regUsername,    setRegUsername]    = useState('');
  const [regEmail,       setRegEmail]       = useState('');
  const [regRole,        setRegRole]        = useState('student');
  const [regPassword,    setRegPassword]    = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [regError,       setRegError]       = useState('');
  const [regLoading,     setRegLoading]     = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.3 + 0.05,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.09 * (1 - dist/100)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const selectedCred = DEMO_CREDENTIALS.find(c => c.role === activeRole);

  const handleFillDemo = () => {
    setUsername(selectedCred.username);
    setPassword(selectedCred.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const match = DEMO_CREDENTIALS.find(
      c => c.username === username.trim().toLowerCase() && c.password === password
    );
    if (match) {
      sessionStorage.setItem('aec_auth', JSON.stringify({ role: match.role, username: match.username, label: match.label }));
      onLogin(match.role);
    } else {
      setError('Invalid username or password. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpEmail.trim() || !fpEmail.includes('@')) {
      setFpError('Please enter a valid email address.');
      return;
    }
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setFpLoading(false);
    setView('forgot-sent');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regUsername.trim()) {
      setRegError('Please choose a username.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPass) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);
    await new Promise(r => setTimeout(r, 1100));
    setRegLoading(false);

    const newUser = {
      role: regRole,
      username: regUsername.trim().toLowerCase(),
      label: `${regName.trim()} (${regRole === 'student' ? 'Student' : regRole === 'staff' ? 'Faculty' : 'Admin'})`,
    };

    sessionStorage.setItem('aec_auth', JSON.stringify(newUser));
    onLogin(newUser.role);
  };

  const roleColors = { student: '#6366f1', staff: '#8b5cf6', admin: '#f59e0b' };
  const activeColor = roleColors[activeRole];

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 25%, #f5f0ff 55%, #fdf4ff 80%, #fff8f0 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
                {/* TOP TASK BAR / HEADER BAR */}
          <nav style={{
            position:'fixed', top:0, left:0, right:0, height:64, zIndex:50,
            background:'rgba(255,255,255,0.78)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
            borderBottom:'1px solid rgba(200,205,255,0.45)',
            padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between',
            boxShadow:'0 4px 20px rgba(99,102,241,0.06)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:36, height:36, borderRadius:12,
                background:'linear-gradient(135deg, #6366f1, #8b5cf6, #f59e0b)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontWeight:900, fontSize:13, letterSpacing:'-0.5px',
                boxShadow:'0 4px 14px rgba(99,102,241,0.3)'
              }}>AEC</div>
              <div>
                <a href="/dashboard" style={{ textDecoration:'none', color:'#1e1b4b', fontWeight:800, fontSize:16, letterSpacing:'-0.3px' }}>AEC Assist</a>
                <span style={{ fontSize:11, color:'rgba(100,116,139,0.7)', marginLeft:8, display:'inline-block' }}>Annapoorana Engineering College</span>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <a href="https://aecsalem.edu.in/" target="_blank" style={{ textDecoration:'none', color:'rgba(71,85,105,0.85)', fontSize:13, fontWeight:600 }}>
                🏠 College Website
              </a>
              <a href="/dashboard" id="nav-dashboard-link" style={{
                textDecoration:'none', color:'#4338ca', background:'rgba(99,102,241,0.12)',
                border:'1.5px solid rgba(99,102,241,0.35)', borderRadius:11, padding:'8px 18px',
                fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:7, transition:'all 0.2s'
              }}>
                📊 Dashboard →
              </a>
            </div>
          </nav>

                    {/* TOP TASK BAR / HEADER BAR */}
          <nav style={{
            position:'fixed', top:0, left:0, right:0, height:64, zIndex:50,
            background:'rgba(255,255,255,0.82)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
            borderBottom:'1.5px solid rgba(200,205,255,0.5)',
            padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between',
            boxShadow:'0 4px 24px rgba(99,102,241,0.08)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{
                width:38, height:38, borderRadius:12,
                background:'linear-gradient(135deg, #6366f1, #8b5cf6, #f59e0b)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontWeight:900, fontSize:14, letterSpacing:'-0.5px',
                boxShadow:'0 4px 14px rgba(99,102,241,0.35)'
              }}>AEC</div>
              <div>
                <a href="/dashboard" style={{ textDecoration:'none', color:'#1e1b4b', fontWeight:800, fontSize:17, letterSpacing:'-0.3px', display:'flex', alignItems:'center', gap:6 }}>
                  AEC Assist <span style={{ fontSize:10, background:'rgba(99,102,241,0.12)', color:'#6366f1', padding:'2px 7px', borderRadius:6, fontWeight:700 }}>AI Portal</span>
                </a>
                <span style={{ fontSize:11, color:'rgba(100,116,139,0.75)', display:'block', lineHeight:1 }}>Annapoorana Engineering College, Salem</span>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:18 }}>
              <a href="https://aecsalem.edu.in/" target="_blank" style={{
                textDecoration:'none', color:'rgba(71,85,105,0.85)', fontSize:13, fontWeight:600,
                display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8,
                transition:'all 0.2s'
              }}>
                🏛️ <span>College Site</span>
              </a>

              <a href="https://admission.aecsalem.edu.in/" target="_blank" style={{
                textDecoration:'none', color:'rgba(71,85,105,0.85)', fontSize:13, fontWeight:600,
                display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8,
                transition:'all 0.2s'
              }}>
                🎓 <span>Admissions</span>
              </a>

              {/* DASHBOARD OPTION IN TASK BAR */}
              <a href="/dashboard" id="taskbar-dashboard-btn" style={{
                textDecoration:'none', color:'white',
                background:'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border:'none', borderRadius:11, padding:'8px 20px',
                fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:8,
                boxShadow:'0 4px 18px rgba(99,102,241,0.35)', transition:'all 0.25s'
              }}>
                <span>📊 Dashboard</span>
                <span>→</span>
              </a>
            </div>
          </nav>

          <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0 }} />
      <div style={{ position:'absolute', top:'-12%', left:'-8%', width:520, height:520, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        animation:'wlOrbFloat 8s ease-in-out infinite', zIndex:1, filter:'blur(2px)' }} />
      <div style={{ position:'absolute', bottom:'-14%', right:'-8%', width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
        animation:'wlOrbFloat 10s ease-in-out infinite reverse', zIndex:1, filter:'blur(2px)' }} />
      <div style={{ position:'absolute', top:'35%', left:'58%', width:380, height:380, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)',
        animation:'wlOrbFloat 13s ease-in-out infinite 1.5s', zIndex:1 }} />
      <div style={{ position:'absolute', top:'62%', left:'8%', width:280, height:280, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
        animation:'wlOrbFloat 11s ease-in-out infinite 3s', zIndex:1 }} />

      <style>{`
        @keyframes wlOrbFloat {
          0%,100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-28px) scale(1.06); }
        }
        @keyframes wlFadeUp {
          from { opacity:0; transform:translateY(30px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes wlFadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes wlShake {
          0%,100% { transform:translateX(0); }
          15%,45%,75% { transform:translateX(-7px); }
          30%,60%,90% { transform:translateX(7px); }
        }
        @keyframes wlSpin { to { transform:rotate(360deg); } }
        @keyframes wlBadgePulse {
          0%,100% { box-shadow: 0 6px 28px rgba(99,102,241,0.42); }
          50%      { box-shadow: 0 8px 48px rgba(99,102,241,0.7); }
        }
        .wl-card { animation: wlFadeUp 0.65s cubic-bezier(.22,1,.36,1) both; }
        .wl-card-shake { animation: wlShake 0.55s ease-in-out; }
        .wl-fview { animation: wlFadeIn 0.35s ease both; }
        .wl-input {
          width:100%; box-sizing:border-box; padding:13px 14px 13px 42px;
          background:rgba(255,255,255,0.78); border:1.5px solid rgba(200,205,255,0.65);
          border-radius:12px; color:#1e1b4b; font-size:14px; font-family:inherit;
          transition:border-color 0.25s, box-shadow 0.25s, background 0.25s; outline:none;
        }
        .wl-input::placeholder { color:rgba(100,116,139,0.46); }
        .wl-input:focus {
          border-color:rgba(99,102,241,0.72); background:rgba(255,255,255,0.97);
          box-shadow:0 0 0 4px rgba(99,102,241,0.13), 0 2px 14px rgba(99,102,241,0.16);
        }
        .wl-role-tab { transition:all 0.22s cubic-bezier(.22,1,.36,1); }
        .wl-role-tab:hover { transform:translateY(-2px); }
        .wl-btn { transition:all 0.25s cubic-bezier(.22,1,.36,1); }
        .wl-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 16px 48px rgba(99,102,241,0.48) !important; }
        .wl-btn:active:not(:disabled) { transform:translateY(0); }
        .wl-link { color:#6366f1; background:none; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:inherit; transition:color 0.2s,text-shadow 0.2s; padding:0; }
        .wl-link:hover { color:#4338ca; text-shadow:0 0 10px rgba(99,102,241,0.45); }
        .wl-demo-btn { transition:all 0.2s; }
        .wl-demo-btn:hover { background:rgba(99,102,241,0.07) !important; border-color:rgba(99,102,241,0.32) !important; }
      `}</style>

      <div
        className={shake ? 'wl-card-shake' : 'wl-card'}
        style={{
          position:'relative', zIndex:10, width:'100%', maxWidth:448, margin:16,
          background:'rgba(255,255,255,0.65)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)',
          border:'1.5px solid rgba(255,255,255,0.88)', borderRadius:30,
          boxShadow:'0 8px 44px rgba(99,102,241,0.18), 0 2px 80px rgba(139,92,246,0.10), inset 0 1px 0 rgba(255,255,255,0.92)',
        }}
      >
        <div style={{ position:'absolute', inset:0, borderRadius:30, pointerEvents:'none',
          boxShadow:`inset 0 0 60px rgba(${hexToRgb(activeColor)},0.06)`, transition:'box-shadow 0.4s' }} />

        {view === 'login' && (
          <>
            <div style={{ padding:'34px 34px 20px', textAlign:'center', borderBottom:'1px solid rgba(200,205,255,0.3)' }}>
              <div style={{
                width:70, height:70, margin:'0 auto 14px', borderRadius:22,
                background:'linear-gradient(135deg, #6366f1, #8b5cf6, #f59e0b)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, fontWeight:900, color:'white', letterSpacing:'-1px',
                animation:'wlBadgePulse 3s ease-in-out infinite',
              }}>AEC</div>
              <h1 style={{ color:'#1e1b4b', fontSize:23, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.5px' }}>AEC Assist</h1>
              <p style={{ color:'rgba(71,85,105,0.78)', fontSize:13, margin:0, lineHeight:1.6 }}>
                Annapoorana Engineering College<br />
                <span style={{ color:activeColor, fontWeight:700, transition:'color 0.3s' }}>Official Document Q&A Portal</span>
              </p>
            </div>
            <div style={{ padding:'18px 32px 0' }}>
              <p style={{ color:'rgba(100,116,139,0.6)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Select Portal</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {DEMO_CREDENTIALS.map(cred => {
                  const isActive = activeRole === cred.role;
                  return (
                    <button key={cred.role} className="wl-role-tab"
                      onClick={() => { setActiveRole(cred.role); setError(''); setUsername(''); setPassword(''); }}
                      style={{
                        padding:'11px 6px', borderRadius:14,
                        border: isActive ? `2px solid ${cred.color}` : '1.5px solid rgba(200,205,255,0.45)',
                        background: isActive ? `rgba(${hexToRgb(cred.color)},0.12)` : 'rgba(255,255,255,0.55)',
                        color: isActive ? cred.color : 'rgba(100,116,139,0.7)',
                        cursor:'pointer', fontSize:11, fontWeight:700,
                        display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                        boxShadow: isActive ? `0 4px 20px rgba(${hexToRgb(cred.color)},0.26)` : 'none',
                      }}>
                      <span style={{ fontSize:22 }}>{cred.badge}</span>
                      <span>{cred.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <form onSubmit={handleSubmit} style={{ padding:'18px 32px 26px' }}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:12, fontWeight:700, marginBottom:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>Username</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                    color: focusedInput==='user' ? activeColor : 'rgba(100,116,139,0.5)',
                    fontSize:16, transition:'color 0.25s', userSelect:'none' }}>&#x1F464;</span>
                  <input id="login-username" className="wl-input" type="text" value={username}
                    onFocus={() => setFocusedInput('user')} onBlur={() => setFocusedInput('')}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder={selectedCred.username} autoComplete="username" />
                </div>
              </div>
              <div style={{ marginBottom:10 }}>
                <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:12, fontWeight:700, marginBottom:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                    color: focusedInput==='pass' ? activeColor : 'rgba(100,116,139,0.5)',
                    fontSize:16, transition:'color 0.25s', userSelect:'none' }}>&#x1F512;</span>
                  <input id="login-password" className="wl-input" type={showPass ? 'text' : 'password'} value={password}
                    onFocus={() => setFocusedInput('pass')} onBlur={() => setFocusedInput('')}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••" autoComplete="current-password" style={{ paddingRight:44 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'rgba(100,116,139,0.55)', fontSize:16, padding:4 }}>
                    {showPass ? '&#x1F648;' : '&#x1F441;&#xFE0F;'}
                  </button>
                </div>
              </div>
              <div style={{ textAlign:'right', marginBottom:16 }}>
                <button type="button" className="wl-link"
                  onClick={() => { setView('forgot'); setError(''); setFpEmail(''); setFpError(''); }}>
                  Forgot password?
                </button>
              </div>
              {error && (
                <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(239,68,68,0.08)',
                  border:'1.5px solid rgba(239,68,68,0.25)', borderRadius:10, color:'#dc2626', fontSize:13,
                  display:'flex', alignItems:'center', gap:8, animation:'wlFadeIn 0.25s ease both' }}>
                  <span>&#x26A0;&#xFE0F;</span> {error}
                </div>
              )}
              <button id="login-submit" className="wl-btn" type="submit" disabled={loading} style={{
                width:'100%', padding:'14px', borderRadius:14, border:'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? `rgba(${hexToRgb(activeColor)},0.4)` : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%)',
                color:'white', fontWeight:700, fontSize:15, letterSpacing:'0.02em',
                boxShadow:`0 8px 28px rgba(${hexToRgb(activeColor)},0.38)`,
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}>
                {loading
                  ? <><span style={{ display:'inline-block', width:18, height:18, border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'white', borderRadius:'50%', animation:'wlSpin 0.75s linear infinite' }}></span> Signing in...</>
                  : `Sign in as ${selectedCred.label}`}
              </button>

              {/* CREATE ACCOUNT OPTION BELOW SIGN IN */}
              <div style={{ marginTop:16, textAlign:'center', fontSize:13, color:'rgba(71,85,105,0.85)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <span>Don't have an account?</span>
                <button id="create-account-link" type="button" className="wl-link" style={{ fontSize:13, fontWeight:700, color:activeColor }}
                  onClick={() => { setView('register'); setError(''); setRegError(''); }}>
                  Create account
                </button>
              </div>

              <div style={{ marginTop:12, textAlign:'center' }}>
                <button type="button" className="wl-demo-btn" onClick={handleFillDemo} style={{
                  background:'rgba(255,255,255,0.65)', border:'1.5px solid rgba(200,205,255,0.5)',
                  borderRadius:9, padding:'7px 20px', color:'rgba(71,85,105,0.7)', fontSize:12, cursor:'pointer', fontWeight:600,
                }}>Use demo credentials &#x2192;</button>
              </div>
            </form>
          </>
        )}

        {view === 'register' && (
          <div className="wl-fview" style={{ padding:'30px 32px 28px' }}>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{
                width:52, height:52, margin:'0 auto 10px', borderRadius:16,
                background:'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, color:'white',
                boxShadow:'0 6px 20px rgba(99,102,241,0.32)',
              }}>&#x2728;</div>
              <h2 style={{ color:'#1e1b4b', fontSize:21, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.3px' }}>Create Account</h2>
              <p style={{ color:'rgba(71,85,105,0.72)', fontSize:12, margin:0 }}>
                Register for AEC Assist Portal access
              </p>
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>Full Name</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'rgba(100,116,139,0.5)', fontSize:15, userSelect:'none' }}>&#x1F464;</span>
                  <input className="wl-input" type="text" value={regName}
                    onChange={e => { setRegName(e.target.value); setRegError(''); }}
                    placeholder="e.g. Ananya Sharma" style={{ padding:'11px 14px 11px 40px', fontSize:13 }} />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>Username</label>
                  <input className="wl-input" type="text" value={regUsername}
                    onChange={e => { setRegUsername(e.target.value); setRegError(''); }}
                    placeholder="username" style={{ padding:'11px 14px', fontSize:13 }} />
                </div>
                <div>
                  <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>Role</label>
                  <select className="wl-input" value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    style={{ padding:'11px 14px', fontSize:13, cursor:'pointer' }}>
                    <option value="student">Student</option>
                    <option value="staff">Faculty / Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'rgba(100,116,139,0.5)', fontSize:15, userSelect:'none' }}>&#x1F4E7;</span>
                  <input className="wl-input" type="email" value={regEmail}
                    onChange={e => { setRegEmail(e.target.value); setRegError(''); }}
                    placeholder="you@aec.edu.in" style={{ padding:'11px 14px 11px 40px', fontSize:13 }} />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                <div>
                  <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>Password</label>
                  <input className="wl-input" type="password" value={regPassword}
                    onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                    placeholder="••••••••" style={{ padding:'11px 14px', fontSize:13 }} />
                </div>
                <div>
                  <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>Confirm</label>
                  <input className="wl-input" type="password" value={regConfirmPass}
                    onChange={e => { setRegConfirmPass(e.target.value); setRegError(''); }}
                    placeholder="••••••••" style={{ padding:'11px 14px', fontSize:13 }} />
                </div>
              </div>

              {regError && (
                <div style={{ marginBottom:12, padding:'9px 13px', background:'rgba(239,68,68,0.08)',
                  border:'1.5px solid rgba(239,68,68,0.25)', borderRadius:9, color:'#dc2626', fontSize:12,
                  animation:'wlFadeIn 0.25s ease both' }}>
                  &#x26A0;&#xFE0F; {regError}
                </div>
              )}

              <button id="register-submit" className="wl-btn" type="submit" disabled={regLoading} style={{
                width:'100%', padding:'13px', borderRadius:14, border:'none', cursor: regLoading ? 'not-allowed' : 'pointer',
                background:'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%)', color:'white', fontWeight:700, fontSize:14,
                boxShadow:'0 8px 24px rgba(99,102,241,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:9,
              }}>
                {regLoading
                  ? <><span style={{ display:'inline-block', width:16, height:16, border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'white', borderRadius:'50%', animation:'wlSpin 0.75s linear infinite' }}></span> Creating Account...</>
                  : 'Create Account & Sign In'}
              </button>

              <div style={{ textAlign:'center', marginTop:14 }}>
                <button type="button" className="wl-link" onClick={() => setView('login')}>&#x2190; Already have an account? Sign in</button>
              </div>
            </form>
          </div>
        )}

        {view === 'forgot' && (
          <div className="wl-fview" style={{ padding:'38px 32px 32px' }}>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <div style={{ fontSize:44, marginBottom:12 }}>&#x1F511;</div>
              <h2 style={{ color:'#1e1b4b', fontSize:20, fontWeight:800, margin:'0 0 6px' }}>Forgot Password?</h2>
              <p style={{ color:'rgba(71,85,105,0.72)', fontSize:13, margin:0, lineHeight:1.65 }}>
                Enter your registered email address.<br />We will send you a reset link.
              </p>
            </div>
            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', color:'rgba(71,85,105,0.78)', fontSize:12, fontWeight:700, marginBottom:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'rgba(100,116,139,0.5)', fontSize:16, userSelect:'none' }}>&#x1F4E7;</span>
                  <input id="fp-email" className="wl-input" type="email" value={fpEmail}
                    onChange={e => { setFpEmail(e.target.value); setFpError(''); }}
                    placeholder="you@aec.edu.in" autoComplete="email" />
                </div>
              </div>
              {fpError && (
                <div style={{ marginBottom:12, padding:'9px 13px', background:'rgba(239,68,68,0.08)',
                  border:'1.5px solid rgba(239,68,68,0.25)', borderRadius:9, color:'#dc2626', fontSize:13,
                  animation:'wlFadeIn 0.25s ease both' }}>
                  &#x26A0;&#xFE0F; {fpError}
                </div>
              )}
              <button className="wl-btn" type="submit" disabled={fpLoading} style={{
                width:'100%', padding:'13px', borderRadius:14, border:'none', cursor: fpLoading ? 'not-allowed' : 'pointer',
                background:'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'white', fontWeight:700, fontSize:14,
                boxShadow:'0 8px 24px rgba(99,102,241,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:9,
              }}>
                {fpLoading
                  ? <><span style={{ display:'inline-block', width:16, height:16, border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'white', borderRadius:'50%', animation:'wlSpin 0.75s linear infinite' }}></span> Sending...</>
                  : 'Send Reset Link'}
              </button>
              <div style={{ textAlign:'center', marginTop:14 }}>
                <button type="button" className="wl-link" onClick={() => setView('login')}>&#x2190; Back to sign in</button>
              </div>
            </form>
          </div>
        )}

        {view === 'forgot-sent' && (
          <div className="wl-fview" style={{ padding:'46px 32px', textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>&#x2705;</div>
            <h2 style={{ color:'#1e1b4b', fontSize:20, fontWeight:800, margin:'0 0 10px' }}>Check Your Email</h2>
            <p style={{ color:'rgba(71,85,105,0.72)', fontSize:13, lineHeight:1.72, margin:'0 0 22px' }}>
              A password reset link has been sent to<br />
              <strong style={{ color:'#6366f1' }}>{fpEmail}</strong><br />
              Please check your inbox and follow the instructions.
            </p>
            <button className="wl-btn" type="button" onClick={() => setView('login')} style={{
              background:'linear-gradient(135deg, #6366f1, #8b5cf6)', border:'none', borderRadius:12, padding:'12px 32px',
              color:'white', fontWeight:700, fontSize:14, cursor:'pointer',
              boxShadow:'0 8px 24px rgba(99,102,241,0.35)',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>&#x2190; Back to Sign In</button>
          </div>
        )}

        <div style={{ padding:'12px 32px 18px', textAlign:'center', borderTop:'1px solid rgba(200,205,255,0.3)' }}>
          <p style={{ color:'rgba(100,116,139,0.48)', fontSize:11, margin:0 }}>
            AEC Salem &middot; NH-47 Sankari Main Road &middot; Salem 636308
          </p>
        </div>
      </div>
    </div>
  );
}


// Helper: hex '#6366f1' => '99,102,241'
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ============================================================
//  ROOT APP SHELL (auth gate)
// ============================================================
function RootApp() {
  const [authData, setAuthData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('aec_auth');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    const defaultAuth = { role: 'student', username: 'student', label: 'Student' };
    sessionStorage.setItem('aec_auth', JSON.stringify(defaultAuth));
    return defaultAuth;
  });

  const handleLogin = (userRole) => {
    try {
      const data = JSON.parse(sessionStorage.getItem('aec_auth') || '{}');
      setAuthData(data);
    } catch {
      setAuthData({ role: userRole, label: userRole });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('aec_auth');
    window.location.href = '/login';
  };

  return <App initialRole={authData.role || 'student'} authData={authData} onLogout={handleLogout} />;
}


function App({ initialRole, authData = {}, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => initialRole === 'staff' ? 'documents' : initialRole === 'admin' ? 'analytics' : 'assistant'); // 'assistant', 'documents', 'upload', 'benchmark', 'analytics', 'settings'
  const [userRole, setUserRole] = useState(() => initialRole || localStorage.getItem('aec_assist_role') || 'student');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('aec_assist_theme') === 'dark');
  const [categoriesData, setCategoriesData] = useState({ categories: [], departments: [] });

  // Assistant Chat State
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [feedbackState, setFeedbackState] = useState({}); // { [msgIdx]: 'up'|'down' }
  const chatBottomRef = useRef(null);

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [docFilterCategory, setDocFilterCategory] = useState('All');
  const [docFilterDept, setDocFilterDept] = useState('All');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [selectedDocModal, setSelectedDocModal] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  // Upload State
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'manual'
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDept, setUploadDept] = useState('Academic Affairs');
  const [uploadType, setUploadType] = useState('circular');
  const [uploadRegulation, setUploadRegulation] = useState('R2021');
  const [uploadAccess, setUploadAccess] = useState('all');
  const [uploadUrgency, setUploadUrgency] = useState('normal');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadText, setUploadText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  // Benchmark & Analytics State
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [unansweredQueries, setUnansweredQueries] = useState([]);

  // Settings State
  const [geminiKey, setGeminiKey] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [admitFormData, setAdmitFormData] = useState({ name: '', phone: '', email: '', dept: 'AI&DS', marks12: '', community: 'General' });
  const [admitSubmitted, setAdmitSubmitted] = useState(false);

  // Initialize
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aec_assist_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('aec_assist_role', userRole);
  }, [userRole]);

  useEffect(() => {
    fetchCategories();
    fetchDocuments();
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
      fetchUnansweredQueries();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (window.lucide) {
      setTimeout(() => window.lucide.createIcons(), 50);
    }
  }, [activeTab, messages, documents, selectedDocModal, userRole, darkMode, benchmarkResults]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategoriesData(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchDocuments = async () => {
    setDocLoading(true);
    try {
      let url = `/api/documents?role=${userRole}`;
      if (docFilterCategory !== 'All') url += `&category=${encodeURIComponent(docFilterCategory)}`;
      if (docFilterDept !== 'All') url += `&department=${encodeURIComponent(docFilterDept)}`;
      if (docSearchQuery) url += `&search=${encodeURIComponent(docSearchQuery)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setDocLoading(false);
    }
  };

  const fetchDocumentDetail = async (id) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      setSelectedDocModal(data);
    } catch (err) {
      alert("Failed to load document details");
    }
  };

  const deleteDocument = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}" and remove all its indexed knowledge chunks?`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      alert("Error deleting document");
    }
  };

  const loadChatHistory = async () => {
    try {
      const res = await fetch('/api/chat/history?session_id=default_session');
      const data = await res.json();
      if (data && data.length > 0) {
        const msgs = [];
        data.forEach((item, idx) => {
          msgs.push({ sender: 'user', text: item.question, role: item.user_role });
          msgs.push({
            id: item.id,
            sender: 'bot',
            text: item.answer,
            intent: item.intent,
            sources: item.sources || [],
            confidence: item.confidence,
            suggested: []
          });
        });
        setMessages(msgs);
      } else {
        setMessages([
          {
            sender: 'bot',
            text: `### 🎓 Welcome to AEC Assist RAG!
**Official Campus AI Assistant for Annapoorana Engineering College (AEC), Salem**
*(Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai • NH-47 Sankari Main Road, Salem - 636308)*

---
### 🌟 Quick Campus Portals & Services:
- 🏛️ **Official College Website**: [aecsalem.edu.in](https://aecsalem.edu.in/) — Programs, Faculty Directory, NAAC/NBA Accreditations & Infrastructure.
- 🎓 **Admissions & Registration 2026**: [admission.aecsalem.edu.in](https://admission.aecsalem.edu.in/) — Online registration, eligibility cutoff, & fee waivers.
- 💳 **Online Fee Payment Portal**: [aecsalem.edu.in/pay](https://aecsalem.edu.in/pay/) — Tuition, hostel, & exam fees.
- 📜 **Official Documents Hub**: 35 active circulars, timetables, syllabus regulations, and bus routes.

---
### 💡 Ask me anything about:
- **Admissions 2026**: Application procedure, cutoff marks, and First Graduate / PMSS scholarships.
- **Academic Timetables**: CSE, AI&DS, ECE, EEE, Mech, Civil class hours and CIA exam dates.
- **Regulations (Anna Univ R-2021)**: Attendance criteria (75%), CIA marks calculation, and revaluation fees.
- **Campus Facilities**: Residential hostel gate timings, 26 college bus routes, and Central Library DELNET access.
- **Helplines**: Principal Dr. A. Anbuchezian, Admission Helpline (+91 9786911333 / 9442000648).`,
            sources: [],
            confidence: 100,
            suggested: userRole === 'student' ? [
              "How do I apply for 2026 Admissions on the College Admission Portal?",
              "What are the academic departments and engineering courses on the College Website?",
              "Where can I pay college tuition fees online via the College Website Portal?",
              "What is the minimum attendance requirement and condonation fee under R-2021?",
              "What are the college bus routes and hostel curfew gate timings?"
            ] : [
              "How many Casual Leaves (CL) and Anna University Zonal OD days are credited per year?",
              "What is the cash incentive for publishing in Scopus / SCI Q1 journals?",
              "What is the morning biometric punching grace timing for AEC faculty?",
              "What is the procedure for Anna University external examiner duty sanction?"
            ]
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleSendMessage = async (queryText = null) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = { sender: 'user', text: textToSend, role: userRole };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          role: userRole,
          category: selectedCategory !== 'All Categories' ? selectedCategory : null,
          department: selectedDept !== 'All Departments' ? selectedDept : null,
          session_id: 'default_session'
        })
      });
      const data = await res.json();

      const botMsg = {
        id: data.chat_id,
        sender: 'bot',
        text: data.answer,
        intent: data.intent,
        sources: data.sources || [],
        confidence: data.confidence || 0,
        suggested: data.suggested_queries || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I couldn't find this in the available college documents. Please contact the relevant office/department for confirmation.",
          sources: [],
          confidence: 0
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitFeedback = async (msgIdx, chatId, question, rating) => {
    setFeedbackState(prev => ({ ...prev, [msgIdx]: rating }));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, question: question, rating: rating })
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const clearChat = async () => {
    if (!confirm("Clear this conversation session?")) return;
    try {
      await fetch('/api/chat/history?session_id=default_session', { method: 'DELETE' });
      setMessages([]);
      loadChatHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setUploadMessage({ type: 'error', text: 'Please enter a document title.' });
      return;
    }

    setUploadLoading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('department', uploadDept);
    formData.append('doc_type', uploadType);
    formData.append('year_regulation', uploadRegulation);
    formData.append('access_level', uploadAccess);
    formData.append('urgency', uploadUrgency);
    formData.append('effective_date', uploadDate);

    if (uploadMode === 'file') {
      if (!selectedFile) {
        setUploadMessage({ type: 'error', text: 'Please select a document file (.pdf, .docx, .xlsx, .png, .jpg).' });
        setUploadLoading(false);
        return;
      }
      formData.append('file', selectedFile);
    } else {
      if (!uploadText.trim()) {
        setUploadMessage({ type: 'error', text: 'Please enter the notice text content.' });
        setUploadLoading(false);
        return;
      }
      formData.append('raw_text', uploadText);
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage({
          type: 'success',
          text: `🎉 Success! Document indexed into ${data.chunk_count} page-tracked vector chunks.`
        });
        setUploadTitle('');
        setUploadText('');
        setSelectedFile(null);
        fetchDocuments();
      } else {
        setUploadMessage({ type: 'error', text: data.error || 'Failed to process document.' });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Network error while uploading.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const runBenchmarkSuite = async () => {
    setBenchmarkLoading(true);
    try {
      const res = await fetch('/api/benchmark', { method: 'POST' });
      const data = await res.json();
      setBenchmarkResults(data);
    } catch (err) {
      alert("Error running benchmark suite.");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const fetchUnansweredQueries = async () => {
    try {
      const res = await fetch('/api/unanswered');
      const data = await res.json();
      setUnansweredQueries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setHasGeminiKey(Boolean(data.has_gemini_key));
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'gemini_api_key', value: geminiKey })
      });
      if (res.ok) {
        setSettingsNotice({ type: 'success', text: 'Gemini API Key saved successfully!' });
        setGeminiKey('');
        fetchSettings();
      }
    } catch (err) {
      setSettingsNotice({ type: 'error', text: 'Failed to update settings.' });
    }
  };


  // Keyboard Back Key listener to navigate between AEC Assist RAG and Login
  useEffect(() => {
    const handleKeyDownBack = (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isInputActive || selectedDocModal) return;
      
      // If on another hub tab, pressing Escape or Backspace takes back to AEC Assist RAG
      if (activeTab !== 'assistant' && (e.key === 'Escape' || e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft'))) {
        setActiveTab('assistant');
        return;
      }
      
      // If already on assistant, Alt+ArrowLeft navigates back to /login
      if (activeTab === 'assistant' && (e.altKey && e.key === 'ArrowLeft')) {
        window.location.href = '/login';
      }
    };
    window.addEventListener('keydown', handleKeyDownBack);
    return () => window.removeEventListener('keydown', handleKeyDownBack);
  }, [selectedDocModal, activeTab]);

  const handleResetSampleData = async () => {
    if (!confirm("This will restore default sample AEC Salem official circulars, regulations, timetables, and bylaws. Proceed?")) return;
    try {
      const res = await fetch('/api/reset-sample', { method: 'POST' });
      if (res.ok) {
        alert("AEC knowledge base successfully restored!");
        fetchDocuments();
        loadChatHistory();
        if (activeTab === 'analytics') fetchAnalytics();
      }
    } catch (err) {
      alert("Error resetting sample data.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-100 flex flex-col h-full z-10 shadow-2xl border-r border-slate-800">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-indigo-500/30">
                  AEC
                </div>
                <div>
                  <h1 className="font-extrabold text-sm text-white">AEC Assist RAG</h1>
                  <p className="text-[10px] text-slate-400">Campusmind Portal</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>

            {/* Portal Role Selector in Mobile Drawer */}
            <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Portal Role</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${userRole === 'student' ? 'bg-emerald-500/20 text-emerald-400' : userRole === 'staff' ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {userRole}
                </span>
              </div>
              <div className="grid grid-cols-3 p-1 bg-slate-800/80 rounded-lg text-xs font-medium gap-1">
                <button
                  onClick={() => { setUserRole('student'); fetchDocuments(); setMobileMenuOpen(false); }}
                  className={`py-1 rounded-md text-center ${userRole === 'student' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
                >
                  Student
                </button>
                <button
                  onClick={() => { setUserRole('staff'); fetchDocuments(); setMobileMenuOpen(false); }}
                  className={`py-1 rounded-md text-center ${userRole === 'staff' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => { setUserRole('admin'); fetchDocuments(); setMobileMenuOpen(false); }}
                  className={`py-1 rounded-md text-center ${userRole === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Navigation links inside Mobile Drawer */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => { setActiveTab('assistant'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'assistant' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <i data-lucide="bot" className="w-4 h-4 text-indigo-400"></i>
                <span>🤖 AI Chatbox</span>
              </button>
              <button
                onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <i data-lucide="user" className="w-4 h-4 text-emerald-400"></i>
                <span>👤 Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab('college-site'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'college-site' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <i data-lucide="globe" className="w-4 h-4 text-blue-400"></i>
                <span>🏛️ College Website</span>
              </button>
              <button
                onClick={() => { setActiveTab('admissions'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'admissions' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <i data-lucide="graduation-cap" className="w-4 h-4 text-amber-400"></i>
                <span>🎓 Registration Portal</span>
              </button>
              <button
                onClick={() => { setActiveTab('documents'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'documents' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <i data-lucide="file-text" className="w-4 h-4 text-violet-400"></i>
                <span>📜 Documents Hub</span>
                {documents.length > 0 && (
                  <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                    {documents.length}
                  </span>
                )}
              </button>
              {(userRole === 'staff' || userRole === 'admin') && (
                <button
                  onClick={() => { setActiveTab('upload'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <i data-lucide="upload-cloud" className="w-4 h-4 text-cyan-400"></i>
                  <span>📤 Ingest Document</span>
                </button>
              )}
              {userRole === 'staff' && (
                <button
                  onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <i data-lucide="help-circle" className="w-4 h-4 text-pink-400"></i>
                  <span>❓ Unanswered Queries</span>
                </button>
              )}
              {userRole === 'admin' && (
                <>
                  <button
                    onClick={() => { setActiveTab('benchmark'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'benchmark' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <i data-lucide="check-square" className="w-4 h-4 text-emerald-400"></i>
                    <span>🧪 Evaluation Suite</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <i data-lucide="bar-chart-3" className="w-4 h-4 text-yellow-400"></i>
                    <span>⚡ System Analytics</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <i data-lucide="settings" className="w-4 h-4 text-slate-400"></i>
                    <span>⚙️ Settings</span>
                  </button>
                </>
              )}
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Theme</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <i data-lucide={darkMode ? "sun" : "moon"} className="w-4 h-4"></i>
                  <span className="capitalize">{darkMode ? 'Light' : 'Dark'}</span>
                </button>
              </div>
              <a
                href="/login"
                className="w-full text-xs py-2 px-3 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-indigo-500/30 font-semibold"
              >
                <i data-lucide="log-out" className="w-3.5 h-3.5"></i>
                Switch Account / Login
              </a>
            </div>
          </aside>
        </div>
      )}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-100 flex-col border-r border-slate-800 shrink-0">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-extrabold text-xs tracking-wider">
            AEC
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
              AEC Assist <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">RAG</span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate">Document Q&A Assistant</p>
          </div>
        </div>

        {/* User Role Switcher */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Portal Mode</span>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${userRole === 'student' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : userRole === 'staff' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {userRole}
            </span>
          </div>
          <div className="grid grid-cols-3 p-1 bg-slate-800/80 rounded-lg text-xs font-medium gap-1">
            <button
              onClick={() => { setUserRole('student'); fetchDocuments(); }}
              className={`py-1 rounded-md transition-all text-center ${userRole === 'student' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Student
            </button>
            <button
              onClick={() => { setUserRole('staff'); fetchDocuments(); }}
              className={`py-1 rounded-md transition-all text-center ${userRole === 'staff' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Faculty
            </button>
            <button
              onClick={() => { setUserRole('admin'); fetchDocuments(); }}
              className={`py-1 rounded-md transition-all text-center ${userRole === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Admin
            </button>
          </div>
        </div>

                {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {/* Primary Core Items for all users */}
          <button
            onClick={() => setActiveTab('assistant')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'assistant' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
          >
            <i data-lucide="bot" className="w-4 h-4 text-indigo-400"></i>
            <span>🤖 AI Chatbox</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
          >
            <i data-lucide="user" className="w-4 h-4 text-emerald-400"></i>
            <span>👤 Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('college-site')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'college-site' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
          >
            <i data-lucide="globe" className="w-4 h-4 text-blue-400"></i>
            <span>🏛️ College Website</span>
          </button>

          <button
            onClick={() => setActiveTab('admissions')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'admissions' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
          >
            <i data-lucide="graduation-cap" className="w-4 h-4 text-amber-400"></i>
            <span>🎓 Registration Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'documents' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
          >
            <i data-lucide="file-text" className="w-4 h-4 text-violet-400"></i>
            <span>📜 Documents Hub</span>
            {documents.length > 0 && (
              <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                {documents.length}
              </span>
            )}
          </button>

          {/* Role-Specific Secondary Items */}
          {(userRole === 'staff' || userRole === 'admin') && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
            >
              <i data-lucide="upload-cloud" className="w-4 h-4 text-cyan-400"></i>
              <span>📤 Ingest Document</span>
            </button>
          )}

          {userRole === 'staff' && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
            >
              <i data-lucide="help-circle" className="w-4 h-4 text-pink-400"></i>
              <span>❓ Unanswered Queries</span>
            </button>
          )}

          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('benchmark')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'benchmark' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
              >
                <i data-lucide="check-square" className="w-4 h-4 text-emerald-400"></i>
                <span>🧪 Evaluation Suite</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
              >
                <i data-lucide="bar-chart-3" className="w-4 h-4 text-yellow-400"></i>
                <span>⚡ System Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
              >
                <i data-lucide="settings" className="w-4 h-4 text-slate-400"></i>
                <span>⚙️ Settings</span>
              </button>
            </>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Theme</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <i data-lucide={darkMode ? "sun" : "moon"} className="w-4 h-4"></i>
              <span className="capitalize">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
          <button
            onClick={handleResetSampleData}
            className="w-full text-xs py-2 px-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50"
          >
            <i data-lucide="rotate-ccw" className="w-3.5 h-3.5"></i>
            Reset Sample Knowledge
          </button>
          <a
            href="/login"
            className="w-full text-xs py-2 px-3 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-300 hover:text-white rounded-lg transition-all flex items-center justify-center gap-1.5 border border-indigo-500/30 font-semibold shadow-sm"
          >
            <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i>
            ← Back to Login
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 pb-16 lg:pb-0 relative">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
              aria-label="Open Navigation Menu"
            >
              <i data-lucide="menu" className="w-5 h-5"></i>
            </button>
            {activeTab !== 'assistant' && (
              <button
                onClick={() => setActiveTab('assistant')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all shrink-0 hover:scale-105"
                title="Return to AEC Assist RAG Assistant"
              >
                <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i>
                <span className="hidden sm:inline">← Back to AEC Assist RAG</span>
                <span className="sm:hidden">← RAG</span>
              </button>
            )}
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                            {activeTab === 'assistant' && (
                <>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <i data-lucide="bot" className="w-5 h-5"></i>
                  </span>
                  <span>AEC Assist: Intelligent Campus Document AI Chatbox</span>
                </>
              )}
              {activeTab === 'profile' && (
                <>
                  <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <i data-lucide="user" className="w-5 h-5"></i>
                  </span>
                  <span>User Profile & Account Portal Settings</span>
                </>
              )}
              {activeTab === 'college-site' && (
                <>
                  <span className="p-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                    <i data-lucide="globe" className="w-5 h-5"></i>
                  </span>
                  <span>Annapoorana Engineering College Official Website Hub</span>
                </>
              )}
              {activeTab === 'admissions' && (
                <>
                  <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
                    <i data-lucide="graduation-cap" className="w-5 h-5"></i>
                  </span>
                  <span>College Registration & Admissions 2026 Portal</span>
                </>
              )}
              {activeTab === 'documents' && (
                <>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <i data-lucide="folder" className="w-5 h-5"></i>
                  </span>
                  <span>Institutional Document Repository & Page-Tracked Viewer</span>
                </>
              )}
              {activeTab === 'upload' && (
                <>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <i data-lucide="plus-circle" className="w-5 h-5"></i>
                  </span>
                  <span>Document Ingestion & OCR Processing Portal</span>
                </>
              )}
              {activeTab === 'benchmark' && (
                <>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <i data-lucide="award" className="w-5 h-5"></i>
                  </span>
                  <span>50-Question Evaluation & Metric Benchmark Suite</span>
                </>
              )}
              {activeTab === 'analytics' && (
                <>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <i data-lucide="pie-chart" className="w-5 h-5"></i>
                  </span>
                  <span>Query Audit Logs & Unanswered Inquiries</span>
                </>
              )}
              {activeTab === 'settings' && (
                <>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <i data-lucide="sliders" className="w-5 h-5"></i>
                  </span>
                  <span>System Settings & Gemini Configuration</span>
                </>
              )}
            </h2>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            <a
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/90 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow"
              title="Return to AEC Login Page (Alt + ←)"
            >
              <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i>
              <span className="hidden sm:inline">Back to Login</span>
              <span className="sm:hidden">Login</span>
            </a>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded-full font-medium">
              <i data-lucide="building" className="w-3.5 h-3.5 text-blue-500"></i>
              <span>AEC Salem</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">RAG Engine Online</span>
              <span className="sm:hidden text-[11px]">Online</span>
            </div>
          </div>
        </header>

        {/* Tab 1: AI Assistant */}
        {activeTab === 'assistant' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Filter Bar */}
            <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedDept('All'); setSelectedCategory('All'); setDocSearchQuery(''); }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800/80 flex items-center gap-1.5 transition-all"
                  title="Reset filters & view all campus intelligence"
                >
                  <i data-lucide="bot" className="w-3.5 h-3.5"></i>
                  <span>🤖 AEC Assist RAG</span>
                </button>
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <i data-lucide="filter" className="w-3.5 h-3.5"></i> Department Filter:
                </span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All Departments">All Departments</option>
                  {categoriesData.departments?.filter(d => d !== 'All Departments').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={clearChat}
                className="text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1 font-medium"
              >
                <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
                Clear Session
              </button>
            </div>

            {/* Quick Campus Portals Access Bar inside AEC Assist RAG */}
            <div className="px-4 sm:px-6 py-2.5 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs overflow-x-auto custom-scrollbar shadow-sm">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">Portals:</span>
                <button
                  onClick={() => setActiveTab('college-site')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold rounded-xl border border-blue-200 dark:border-blue-800/80 transition-all shadow-sm hover:scale-105"
                  title="Open College Website Tab"
                >
                  <i data-lucide="globe" className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"></i>
                  <span>🏛️ College Website</span>
                </button>
                <button
                  onClick={() => setActiveTab('admissions')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold rounded-xl border border-amber-200 dark:border-amber-800/80 transition-all shadow-sm hover:scale-105"
                  title="Open College Admission Portal Tab"
                >
                  <i data-lucide="graduation-cap" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"></i>
                  <span>🎓 Admission Portal</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold rounded-xl border border-purple-200 dark:border-purple-800/80 transition-all shadow-sm hover:scale-105"
                  title="Open Documents Hub"
                >
                  <i data-lucide="file-text" className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"></i>
                  <span>📜 Documents Hub ({documents.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="https://aecsalem.edu.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>aecsalem.edu.in ↗</span>
                </a>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <a
                  href="https://admission.aecsalem.edu.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>admission.aecsalem.edu.in ↗</span>
                </a>
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 max-w-4xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 dark:bg-indigo-950 text-indigo-400 border border-indigo-500/20'}`}>
                    <i data-lucide={msg.sender === 'user' ? "user" : "bot"} className="w-5 h-5"></i>
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-3 max-w-2xl rounded-2xl p-5 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'}`}>
                    
                    {/* Bot response top info bar */}
                    {msg.sender === 'bot' && (
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <i data-lucide="shield-check" className="w-4 h-4 text-emerald-500"></i>
                          AEC Official Document Context
                        </span>
                        {msg.intent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Intent: {msg.intent}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Markdown Body */}
                    <div
                      className="markdown-body text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(msg.text) : msg.text }}
                    />

                    {/* Source Cards with Exact Page Number */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <i data-lucide="book-open" className="w-3.5 h-3.5 text-indigo-500"></i>
                          Cited College Documents & Page Numbers:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((s, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => fetchDocumentDetail(s.document_id)}
                              className="text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2 text-left"
                            >
                              <i data-lucide="file-text" className="w-3.5 h-3.5 shrink-0 text-indigo-500"></i>
                              <span className="truncate max-w-[220px] font-medium">{s.title}</span>
                              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                                Page {s.page_number}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Queries */}
                    {msg.suggested && msg.suggested.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Suggested Questions:</p>
                        <div className="flex flex-col gap-1.5">
                          {msg.suggested.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSendMessage(q)}
                              className="text-xs text-left bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between group"
                            >
                              <span>{q}</span>
                              <i data-lucide="arrow-right" className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 👍 / 👎 Feedback Bar */}
                    {msg.sender === 'bot' && msg.id && (
                      <div className="pt-2 flex items-center justify-end gap-2 text-xs text-slate-400">
                        <span>Was this helpful?</span>
                        <button
                          onClick={() => submitFeedback(idx, msg.id, msg.text, 'up')}
                          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${feedbackState[idx] === 'up' ? 'text-emerald-500 font-bold' : ''}`}
                          title="Helpful"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => submitFeedback(idx, msg.id, msg.text, 'down')}
                          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${feedbackState[idx] === 'down' ? 'text-rose-500 font-bold' : ''}`}
                          title="Not Helpful"
                        >
                          👎
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-2xl">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center shadow-sm">
                    <i data-lucide="bot" className="w-5 h-5 animate-pulse"></i>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-2 text-sm text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-2 text-xs">Searching AEC Salem document repository...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="max-w-4xl mx-auto flex gap-2 relative"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={userRole === 'student' ? "Ask about Anna University attendance, condonation fee, tuition dates, exam timetables, bus routes..." : "Ask about Casual Leave (CL), Anna University Zonal OD, research incentives, biometric rules..."}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isTyping}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center shadow-md shadow-indigo-600/30"
                  >
                    <i data-lucide="send" className="w-4 h-4"></i>
                  </button>
                </div>
              </form>
              <div className="max-w-4xl mx-auto mt-2 text-center text-[11px] text-slate-400">
                AEC Assist answers strictly from retrieved college documents with source and page citations.
              </div>
            </div>

          </div>
        )}

                {/* Tab: User Profile */}
        {activeTab === 'profile' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Back to AEC Assist RAG Navigation Key */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('assistant')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
                >
                  <i data-lucide="arrow-left" className="w-4 h-4"></i>
                  <span>← Back to AEC Assist RAG</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">User Profile & Account Portal</span>
              </div>
              
              {/* Profile Header Banner */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-extrabold shadow-inner border border-white/30">
                    {userRole === 'student' ? '🎓' : userRole === 'staff' ? '👨‍🏫' : '🛡️'}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h3 className="text-2xl font-extrabold">{authData.label || authData.username || 'AEC Portal User'}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-white/20 text-white border border-white/30">
                        {userRole === 'student' ? 'Student' : userRole === 'staff' ? 'Faculty & Staff' : 'Administrator'}
                      </span>
                    </div>
                    <p className="text-indigo-100 text-sm">Annapoorana Engineering College, Salem • NH-47 Sankari Main Road</p>
                    <p className="text-xs text-indigo-200 mt-1">Username: <span className="font-mono font-semibold">{authData.username || userRole}</span></p>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 bg-white/15 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all border border-white/25 flex items-center gap-2 shadow"
                    >
                      <i data-lucide="log-out" className="w-4 h-4"></i>
                      Sign Out
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Academic & Role Credentials */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <i data-lucide="badge-check" className="w-4 h-4 text-indigo-600"></i>
                    Account & Academic Info
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Institutional Role</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">{userRole}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Portal ID</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {userRole === 'student' ? 'AEC/2026/STU-882' : userRole === 'staff' ? 'AEC/2026/FAC-104' : 'AEC/SYS/ADM-001'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {userRole === 'student' ? 'Computer Science & Engineering' : userRole === 'staff' ? 'Academic Faculty Wing' : 'Central Administration'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Regulation</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Anna Univ R-2021 CBCS</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Portal Status</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active & Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions & Security */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <i data-lucide="shield" className="w-4 h-4 text-emerald-600"></i>
                    Portal Permissions & Access
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">RAG Document Assistant</div>
                        <div className="text-slate-500">Query college regulations, timetables & bylaws</div>
                      </div>
                      <span className="text-emerald-600 font-bold">Enabled</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">Official Document Ingestion</div>
                        <div className="text-slate-500">Upload PDF, DOCX & OCR circulars</div>
                      </div>
                      <span className={userRole !== 'student' ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                        {userRole !== 'student' ? 'Granted' : 'Staff Only'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">System Benchmarks & Settings</div>
                        <div className="text-slate-500">50-Q Evaluation Suite & Gemini Config</div>
                      </div>
                      <span className={userRole === 'admin' ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                        {userRole === 'admin' ? 'Full Admin' : 'Restricted'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Quick Actions Bar */}
              <div className="p-5 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-indigo-600 text-white rounded-xl">
                    <i data-lucide="settings" className="w-5 h-5"></i>
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Need to update your credentials?</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Contact the AEC Administration & Computer Center on campus</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('assistant')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  >
                    Open AI Chatbox →
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab: College Website Hub */}
        {activeTab === 'college-site' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Back to AEC Assist RAG Navigation Key */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('assistant')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
                >
                  <i data-lucide="arrow-left" className="w-4 h-4"></i>
                  <span>← Back to AEC Assist RAG</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">College Website Hub (aecsalem.edu.in)</span>
              </div>
              
              {/* Header Hero */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                      Official Portal
                    </span>
                    <span className="text-xs text-blue-200">AICTE Approved • Anna University Affiliated</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Annapoorana Engineering College</h3>
                  <p className="text-blue-100 text-sm mt-1">NH-47 Sankari Main Road, Periya Seeragapadi, Salem - 636308, Tamil Nadu</p>
                </div>
                <a
                  href="https://aecsalem.edu.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0"
                >
                  <i data-lucide="external-link" className="w-4 h-4"></i>
                  Launch aecsalem.edu.in ↗
                </a>
              </div>

              {/* Quick Links Hub Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <a
                  href="https://admission.aecsalem.edu.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                    🎓
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Admissions 2026</h4>
                  <p className="text-xs text-slate-500 mt-1">Online application & eligibility criteria</p>
                </a>

                <a
                  href="https://aecsalem.edu.in/pay/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                    💳
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Online Fee Payment</h4>
                  <p className="text-xs text-slate-500 mt-1">Tuition, hostel & exam fee portal</p>
                </a>

                <div
                  onClick={() => setActiveTab('documents')}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                    📜
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Circulars & Timetables</h4>
                  <p className="text-xs text-slate-500 mt-1">Anna Univ R2021 & Exam notifications</p>
                </div>

                <div
                  onClick={() => setActiveTab('assistant')}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">AI Campus Mind</h4>
                  <p className="text-xs text-slate-500 mt-1">Instant Q&A from college data</p>
                </div>
              </div>

              {/* Departments & Research Centres */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i data-lucide="layers" className="w-5 h-5 text-indigo-600"></i>
                  Academic Departments & Programmes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Artificial Intelligence & Data Science</div>
                    <div className="text-slate-500">B.Tech • 4 Years CBCS</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Computer Science & Engineering</div>
                    <div className="text-slate-500">B.E. & M.E. Programmes</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Information Technology (IT)</div>
                    <div className="text-slate-500">B.Tech • Software Engineering</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Electronics & Communication (ECE)</div>
                    <div className="text-slate-500">B.E. & M.E. Communication Systems</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Electrical & Electronics (EEE)</div>
                    <div className="text-slate-500">B.E. & M.E. Power Electronics</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Mechanical & Automobile Engineering</div>
                    <div className="text-slate-500">B.E. & M.E. Safety Engineering</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Civil & Structural Engineering</div>
                    <div className="text-slate-500">B.E. & M.E. Structural Engg</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Biomedical Engineering (BME)</div>
                    <div className="text-slate-500">B.E. Medical Technologies</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">Science, Humanities & Management</div>
                    <div className="text-slate-500">Maths, Physics, Chem, English, Tamil</div>
                  </div>
                </div>
              </div>

              {/* Direct Contacts & Address */}
              <div className="p-6 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                <div className="space-y-1 text-center md:text-left">
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">Contact Campus Directory</div>
                  <div className="text-slate-500">Principal: Dr. A. Anbuchezian | Email: info@aecsalem.edu.in</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="tel:+919786911333" className="px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow">
                    📞 +91 9786911333
                  </a>
                  <a href="tel:+919442000648" className="px-3.5 py-2 bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow">
                    📞 +91 9442000648
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab: College Registration & Admissions Portal */}
        {activeTab === 'admissions' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Back to AEC Assist RAG Navigation Key */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('assistant')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
                >
                  <i data-lucide="arrow-left" className="w-4 h-4"></i>
                  <span>← Back to AEC Assist RAG</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">AEC Assist • College Admission Portal 2026</span>
              </div>
              
              {/* Back to AEC Assist RAG Navigation Key */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('assistant')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
                >
                  <i data-lucide="arrow-left" className="w-4 h-4"></i>
                  <span>← Back to AEC Assist RAG</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">Admissions & Registration 2026</span>
              </div>
              
              {/* Admissions Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                      Admissions Open 2026-2027
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">College Registration & Application Portal</h3>
                    <p className="text-amber-100 text-sm mt-1 max-w-xl">
                      Apply for Under Graduate (B.E. / B.Tech) and Post Graduate (M.E.) Engineering programmes at Annapoorana Engineering College, Salem.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <a
                      href="https://admission.aecsalem.edu.in/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 bg-white text-orange-900 hover:bg-orange-50 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <i data-lucide="edit-3" className="w-4 h-4"></i>
                      Online Registration ↗
                    </a>
                    <a
                      href="https://aecsalem.edu.in/pay/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 bg-slate-900/80 hover:bg-slate-950 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-white/20"
                    >
                      <i data-lucide="credit-card" className="w-4 h-4"></i>
                      Online Fee Portal ↗
                    </a>
                  </div>
                </div>
              </div>


              {/* Interactive Online Admission Application Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <i data-lucide="edit-3" className="w-5 h-5 text-amber-500"></i>
                      Online Registration & Admission Form 2026-2027
                    </h4>
                    <p className="text-xs text-slate-500">Instant registration for B.E. / B.Tech engineering admissions at AEC Salem</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                    🟢 Portal Active
                  </span>
                </div>

                {admitSubmitted ? (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl mx-auto shadow-lg shadow-emerald-500/30">
                      ✓
                    </div>
                    <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">Registration Successfully Submitted!</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                      Thank you, <strong>{admitFormData.name}</strong>. Your registration for <strong>{admitFormData.dept}</strong> has been received with Application ID: <span className="font-mono font-bold">AEC2026-{Math.floor(100000 + Math.random() * 900000)}</span>.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={() => setAdmitSubmitted(false)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
                      >
                        Submit Another Form
                      </button>
                      <button
                        onClick={() => setActiveTab('assistant')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
                      >
                        Ask AI About Admission Status →
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!admitFormData.name || !admitFormData.phone) {
                        alert("Please provide your full name and contact phone number.");
                        return;
                      }
                      setAdmitSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Student Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. S. Karthikeyan"
                          value={admitFormData.name}
                          onChange={(e) => setAdmitFormData({...admitFormData, name: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Mobile / WhatsApp Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={admitFormData.phone}
                          onChange={(e) => setAdmitFormData({...admitFormData, phone: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="student@example.com"
                          value={admitFormData.email}
                          onChange={(e) => setAdmitFormData({...admitFormData, email: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Preferred Engineering Branch *</label>
                        <select
                          value={admitFormData.dept}
                          onChange={(e) => setAdmitFormData({...admitFormData, dept: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="B.Tech Artificial Intelligence & Data Science (AI&DS)">B.Tech Artificial Intelligence & Data Science (AI&DS)</option>
                          <option value="B.E. Computer Science & Engineering (CSE)">B.E. Computer Science & Engineering (CSE)</option>
                          <option value="B.Tech Information Technology (IT)">B.Tech Information Technology (IT)</option>
                          <option value="B.E. Electronics & Communication Engineering (ECE)">B.E. Electronics & Communication Engineering (ECE)</option>
                          <option value="B.E. Electrical & Electronics Engineering (EEE)">B.E. Electrical & Electronics Engineering (EEE)</option>
                          <option value="B.E. Mechanical Engineering">B.E. Mechanical Engineering</option>
                          <option value="B.E. Biomedical Engineering (BME)">B.E. Biomedical Engineering (BME)</option>
                          <option value="B.E. Civil Engineering">B.E. Civil Engineering</option>
                          <option value="M.E. Computer Science / Structural / Power Electronics">M.E. PG Programmes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">+2 / Diploma Aggregate (%)</label>
                        <input
                          type="number"
                          placeholder="e.g. 85%"
                          value={admitFormData.marks12}
                          onChange={(e) => setAdmitFormData({...admitFormData, marks12: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Quota / Category</label>
                        <select
                          value={admitFormData.community}
                          onChange={(e) => setAdmitFormData({...admitFormData, community: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="General TNEA">TNEA Single Window Govt Quota</option>
                          <option value="Management Quota">Management Merit Quota</option>
                          <option value="First Graduate Scheme">First Graduate Fee Waiver Scheme (TN Govt)</option>
                          <option value="SC / ST / SCC Post-Matric">SC / ST Post-Matric Scholarship</option>
                          <option value="Lateral Entry (Diploma)">Direct 2nd Year Lateral Entry</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <i data-lucide="shield-check" className="w-4 h-4 text-emerald-500"></i>
                        <span>No application processing fee. 100% verified AICTE application.</span>
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 hover:scale-105"
                      >
                        <span>Submit Online Registration</span>
                        <span>→</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 4-Step Registration Guide */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i data-lucide="check-circle-2" className="w-5 h-5 text-emerald-600"></i>
                  4-Step Admission & Registration Process
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">1</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Online Application</div>
                    <p className="text-slate-500 leading-relaxed">Register on the admission portal with 10th & 12th / Diploma marks and personal details.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">2</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Document Verification</div>
                    <p className="text-slate-500 leading-relaxed">Submit marksheets, Community certificate, TC & First Graduate certificates for verification.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">3</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Seat Allotment</div>
                    <p className="text-slate-500 leading-relaxed">Select your preferred branch (AI&DS, CSE, IT, ECE, EEE, MECH, CIVIL, BME) under TNEA or Management quota.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">4</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Fee Remittance & ID</div>
                    <p className="text-slate-500 leading-relaxed">Complete tuition / hostel fee payment online at aecsalem.edu.in/pay/ and receive your student ID card.</p>
                  </div>
                </div>
              </div>

              {/* Scholarship & Helpline info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <i data-lucide="award" className="w-4 h-4 text-amber-500"></i>
                    Scholarships & Fee Concessions
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>First Graduate Scholarship (Govt of TN)</strong>: ₹25,000/year fee concession.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Post-Matric Scholarship (SC / ST / SCC)</strong>: 100% tuition & exam fee waiver.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Merit Scholarships</strong>: High cut-off scorers in +2 board examinations.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <i data-lucide="phone" className="w-4 h-4 text-indigo-500"></i>
                    Admissions Helpdesk 2026
                  </h4>
                  <p className="text-xs text-slate-500">For enquiries regarding cutoff, fees, bus routes, or hostel facilities:</p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Admission Hotline:</span>
                      <a href="tel:+919786911333" className="font-bold text-indigo-600 dark:text-indigo-400">+91 9786911333</a>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">College Office:</span>
                      <a href="tel:+919442000648" className="font-bold text-indigo-600 dark:text-indigo-400">+91 9442000648</a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Documents Hub */}
        {activeTab === 'documents' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center justify-between mb-6">
              <button
                onClick={() => setActiveTab('assistant')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all shrink-0 hover:scale-105"
                title="Return to AEC Assist RAG AI Chatbox"
              >
                <i data-lucide="arrow-left" className="w-4 h-4"></i>
                <span>← Back to AEC Assist RAG</span>
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                <div className="relative flex-1">
                  <i data-lucide="search" className="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
                    placeholder="Search circulars, regulations, timetables..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={fetchDocuments}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Filter
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={docFilterDept}
                  onChange={(e) => { setDocFilterDept(e.target.value); setTimeout(fetchDocuments, 10); }}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Departments</option>
                  {categoriesData.departments?.filter(d => d !== 'All Departments').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Cards Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {docLoading ? (
                <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
                  <i data-lucide="loader-2" className="w-6 h-6 animate-spin text-indigo-500"></i>
                  Loading official documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <i data-lucide="file-question" className="w-8 h-8 text-slate-400 mx-auto mb-2"></i>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No documents found</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 capitalize">
                            {doc.doc_type || 'circular'}
                          </span>
                          {doc.urgency === 'urgent' && (
                            <span className="text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">
                              Urgent
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-2">
                          {doc.title}
                        </h4>

                        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-4">
                          <p><strong>Department:</strong> {doc.department}</p>
                          <p><strong>Regulation/Year:</strong> {doc.year_regulation}</p>
                          <p><strong>Effective Date:</strong> {doc.effective_date || 'Immediate'}</p>
                          <p><strong>Access Level:</strong> <span className="capitalize font-semibold">{doc.access_level}</span></p>
                          <p><strong>Chunk Count:</strong> {doc.chunk_count} page chunks</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => fetchDocumentDetail(doc.id)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <i data-lucide="eye" className="w-3.5 h-3.5"></i>
                          View Pages & Text
                        </button>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => deleteDocument(doc.id, doc.title)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                          >
                            <i data-lucide="trash-2" className="w-4 h-4"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Upload & Ingestion Portal */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingest Institutional Document (PDF, DOCX, XLSX, OCR)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload PDF notices, Word handbooks, Excel timetables, or scanned circular images. AEC Assist parses page-by-page and extracts page metadata for grounding.
                </p>
              </div>

              {uploadMessage && (
                <div className={`p-4 rounded-xl text-sm mb-6 flex items-center gap-2 ${uploadMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-500/30'}`}>
                  <i data-lucide={uploadMessage.type === 'success' ? 'check-circle' : 'alert-circle'} className="w-5 h-5 shrink-0"></i>
                  <span>{uploadMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${uploadMode === 'file' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <i data-lucide="file-up" className="w-4 h-4"></i>
                  Upload File (.pdf, .docx, .xlsx, image)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('manual')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${uploadMode === 'manual' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <i data-lucide="edit-3" className="w-4 h-4"></i>
                  Compose Notice Text
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. End Semester Exam Schedule & Hall Ticket Rules (Odd Sem 2026-27)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Issuing Department *
                    </label>
                    <select
                      value={uploadDept}
                      onChange={(e) => setUploadDept(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                    >
                      {categoriesData.departments?.filter(d => d !== 'All Departments').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Document Type *
                    </label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="circular">Circular</option>
                      <option value="regulation">Academic Regulation</option>
                      <option value="timetable">Timetable</option>
                      <option value="notice">Department Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Academic Year / Regulation
                    </label>
                    <input
                      type="text"
                      value={uploadRegulation}
                      onChange={(e) => setUploadRegulation(e.target.value)}
                      placeholder="R2021 or 2026-2027"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Access Level
                    </label>
                    <select
                      value={uploadAccess}
                      onChange={(e) => setUploadAccess(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="all">Everyone (Student & Staff)</option>
                      <option value="student">Student Only</option>
                      <option value="staff">Faculty / Staff Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={uploadUrgency}
                      onChange={(e) => setUploadUrgency(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Document File (.pdf, .docx, .xlsx, .png, .jpg)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-slate-50 dark:bg-slate-950 relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.txt,.md"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-2">
                        <i data-lucide="upload" className="w-8 h-8 text-indigo-500 mx-auto"></i>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {selectedFile ? selectedFile.name : "Click or drag file to ingest"}
                        </p>
                        <p className="text-xs text-slate-400">PDF, DOCX, XLSX (Excel tables), PNG/JPG (OCR)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Notice Text Content (Use '--- Page X ---' for page markers)
                    </label>
                    <textarea
                      rows="8"
                      value={uploadText}
                      onChange={(e) => setUploadText(e.target.value)}
                      placeholder="--- Page 1 ---\nANNAPOORANA ENGINEERING COLLEGE, SALEM\nCIRCULAR: ..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white font-mono"
                    ></textarea>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {uploadLoading ? "Parsing & Indexing Pages..." : "Ingest & Index Document"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: 50-Question Benchmark Suite */}
        {activeTab === 'benchmark' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <i data-lucide="award" className="w-5 h-5 text-indigo-500"></i>
                    AEC Assist 50-Question Evaluation & Metric Benchmark Suite
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Evaluates retrieval accuracy, answer correctness, and citation formatting across 50 ground-truth test questions.
                  </p>
                </div>
                <button
                  onClick={runBenchmarkSuite}
                  disabled={benchmarkLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  {benchmarkLoading ? (
                    <>
                      <i data-lucide="loader-2" className="w-4 h-4 animate-spin"></i>
                      Evaluating 50 Test Questions...
                    </>
                  ) : (
                    <>
                      <i data-lucide="play" className="w-4 h-4"></i>
                      Run Live Benchmark Suite
                    </>
                  )}
                </button>
              </div>

              {benchmarkResults && (
                <div className="space-y-6">
                  {/* Summary Metric Scorecards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-500/30 text-center">
                      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Retrieval Accuracy</div>
                      <div className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">{benchmarkResults.retrieval_accuracy}%</div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-center">
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Answer Correctness</div>
                      <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{benchmarkResults.answer_correctness}%</div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-500/30 text-center">
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Citation Correctness</div>
                      <div className="text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">{benchmarkResults.citation_correctness}%</div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-500/30 text-center">
                      <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Overall RAG Score</div>
                      <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">{benchmarkResults.overall_score}%</div>
                    </div>
                  </div>

                  {/* Benchmark Detailed Results List */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <tr>
                          <th className="py-2.5">#</th>
                          <th className="py-2.5">Test Question</th>
                          <th className="py-2.5">Retrieval</th>
                          <th className="py-2.5">Answer</th>
                          <th className="py-2.5">Citation</th>
                          <th className="py-2.5">Generated Snippet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {benchmarkResults.results.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2 font-bold">{r.id}</td>
                            <td className="py-2 font-medium">{r.question}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded font-bold ${r.retrieval_ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {r.retrieval_ok ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded font-bold ${r.answer_ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {r.answer_ok ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded font-bold ${r.citation_ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {r.citation_ok ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                            <td className="py-2 text-[11px] text-slate-400 max-w-xs truncate">{r.answer_snippet}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Analytics & Audit Logs */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {analytics ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Total Documents</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{analytics.total_documents}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Knowledge Chunks</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{analytics.total_chunks}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Queries Handled</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{analytics.total_searches}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Unanswered Queries</span>
                    <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{analytics.total_unanswered}</div>
                  </div>
                </div>

                {/* Unanswered Queries Log for Review */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <i data-lucide="alert-triangle" className="w-4 h-4 text-rose-500"></i>
                    Logged Unanswered Questions (For Admin Document Review)
                  </h4>
                  {unansweredQueries.length === 0 ? (
                    <p className="text-xs text-slate-400">No unanswered queries logged yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                          <tr>
                            <th className="py-2">Query</th>
                            <th className="py-2">User Role</th>
                            <th className="py-2">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {unansweredQueries.map((uq) => (
                            <tr key={uq.id}>
                              <td className="py-2 font-medium">{uq.query}</td>
                              <td className="py-2 capitalize">{uq.user_role}</td>
                              <td className="py-2 text-slate-400">{uq.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div className="text-center py-12 text-slate-400">Loading metrics...</div>
            )}
          </div>
        )}

        {/* Tab 6: Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <i data-lucide="key" className="w-5 h-5 text-amber-500"></i>
                  Google Gemini API Key (Optional)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  AEC Assist uses zero-API deterministic grounding by default. Adding a Gemini key enables conversational synthesis.
                </p>

                {settingsNotice && (
                  <div className="p-3 rounded-xl text-xs mb-4 bg-emerald-50 text-emerald-700">
                    {settingsNotice.text}
                  </div>
                )}

                <form onSubmit={saveSettings} className="space-y-3">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Enter Gemini API Key (e.g. AIzaSy...)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Save Key
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Document Detail Modal with Page Viewer */}
      {selectedDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 capitalize">
                  {selectedDocModal.doc_type || 'Document'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                  {selectedDocModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Issued by: <strong className="text-slate-700 dark:text-slate-300">{selectedDocModal.department}</strong> | Regulation: {selectedDocModal.year_regulation} | Date: {selectedDocModal.effective_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedDocModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar text-sm">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Extracted Document Text (Page-by-Page):</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {selectedDocModal.raw_text}
                </div>
              </div>

              {selectedDocModal.chunks && selectedDocModal.chunks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Indexed Page Chunks ({selectedDocModal.chunks.length}):
                  </h4>
                  <div className="space-y-2">
                    {selectedDocModal.chunks.map((chk, cIdx) => (
                      <div key={cIdx} className="p-3 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-indigo-500 mr-2">Page #{chk.page_number} (Chunk {chk.chunk_index + 1}):</span>
                        {chk.content.slice(0, 180)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setSelectedDocModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<RootApp />);

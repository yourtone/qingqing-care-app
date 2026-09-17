const STORAGE_KEY = 'qingqing-demo-v1';
const roles = {
  elder: { name: '长者', emoji: '👵', description: '记录心情、申请陪伴、与亲友分享生活' },
  volunteer: { name: '志愿者', emoji: '🧑‍⚕️', description: '查看服务请求、练习护理沟通情境' },
  family: { name: '亲友', emoji: '👨‍👩‍👧', description: '了解主动分享的近况、送上一句关心' }
};
const navs = {
  elder: [['home','⌂','首页'],['community','◌','暖心社区'],['care','♡','关怀陪伴'],['health','＋','健康记录'],['family','✉','亲友留言']],
  volunteer: [['home','⌂','工作台'],['care','♡','陪伴请求'],['simulation','✦','沟通仿真'],['community','◌','暖心社区']],
  family: [['home','⌂','亲友首页'],['family','✉','关怀留言'],['health','＋','共享近况'],['community','◌','暖心社区']]
};
const scenarios = [
  {
    phase:'建立关系', title:'先听见她的心声', quote:'“最近不太想出门，跟别人也没什么好说的。”',
    context:'王阿姨，72 岁，独居。社区工作人员发现她一周没有参加晨间活动。你作为经过培训的志愿者，开始一次关怀探访。',
    choices:[
      {text:'“您愿意和我聊聊最近的感受吗？我会认真听。”', score:1, feedback:'先征得同意，使用开放式提问和倾听，有助于建立信任。'},
      {text:'“别想太多，出去走走就好了。”', score:0, feedback:'直接劝慰可能让对方觉得自己的感受被忽略。先了解她的经历。'},
      {text:'“我给您推荐一种药，吃了就会好。”', score:0, feedback:'志愿者不能建议用药。应倾听并把需要专业评估的情况转交专业人员。'}
    ]
  },
  {
    phase:'识别需要', title:'温和询问，留意风险', quote:'“晚上总睡不好，也没胃口。孩子忙，我不想给他们添麻烦。”',
    context:'王阿姨愿意继续说，但情绪低落。下一步怎样了解她的需要？',
    choices:[
      {text:'询问这些变化持续多久、对生活有何影响，并温和了解有无伤害自己的想法。', score:1, feedback:'关注持续时间、功能变化和安全风险，有助于决定是否需要及时转介。'},
      {text:'保证绝对保密，不再追问，也不做任何记录。', score:0, feedback:'尊重隐私很重要，但涉及安全风险时应按事先说明的规则寻求专业协助。'},
      {text:'马上将完整对话截图发到社区群，请大家讨论。', score:0, feedback:'公开传播私人对话侵犯隐私。应仅向有职责的专业人员共享必要信息。'}
    ]
  },
  {
    phase:'安全转介', title:'把关怀接续下去', quote:'“有时觉得活着没意思，但我也不知道该怎么办。”',
    context:'她说出了值得重视的信号。作为志愿者，你应选择什么行动？',
    choices:[
      {text:'保持陪伴，立即联系值守的专业人员，按机构预案评估安全并协调后续支持。', score:1, feedback:'正确。志愿者不独自判断风险，应保持陪伴并迅速启动专业评估与机构预案。'},
      {text:'答应她不要告诉任何人，然后结束探访。', score:0, feedback:'此时不能承诺绝对保密或直接离开。应说明为了安全需要寻求专业帮助。'},
      {text:'继续自行开导，等下次探访再看。', score:0, feedback:'延后处理可能错过及时支持。应立即按预案联系专业人员。'}
    ]
  }
];
const reactions = [
  ['王阿姨放慢语速，愿意再说一些最近的生活。','王阿姨先沉默了一会儿。你放缓语气后，她继续讲述。','王阿姨显得有些迟疑。你停止建议，重新听她说。'],
  ['王阿姨感到被认真对待，告诉你更多内心的担忧。','王阿姨不再展开。你解释关怀和保密边界后，她继续说。','王阿姨担心隐私。你停止分享信息并重新取得她的信任。']
];
const initialData = () => ({
  mood: null,
  moodDate: '',
  requests: [],
  health: [],
  messages: [{id:1,from:'亲友',text:'妈，今天忙完就给您打电话。记得去楼下晒晒太阳呀！',time:'演示留言'}],
  posts: [
    {id:1,author:'王阿姨',text:'今天跟邻居一起种了两盆小花。分享一点好心情 🌼',time:'社区示例',likes:8,liked:false},
    {id:2,author:'社区志愿者',text:'周六下午有读书分享会，欢迎大家带上自己喜欢的书来交流。',time:'社区示例',likes:5,liked:false}
  ],
  completed: 0
});
let data = loadData();
let ui = {role:null,page:'home',roleDialog:true,scenarioStep:0,scenarioChoice:null,scenarioScore:0,scenarioDone:false,scenarioHistory:[],toast:''};
function loadData(){try{return {...initialData(),...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}}catch{return initialData()}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function esc(s){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function today(){return new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'})}
function stamp(){return new Date().toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
function toast(message){ui.toast=message;render();setTimeout(()=>{if(ui.toast===message){ui.toast='';document.querySelector('.toast')?.remove()}},2600)}
function pageTitle(){
 const t={home:ui.role==='elder'?'让今天，也充满温暖':ui.role==='volunteer'?'每一份陪伴，都有回应':'距离再远，关心也在身边',community:'暖心社区',care:ui.role==='volunteer'?'陪伴请求':'关怀陪伴',health:ui.role==='family'?'共享近况':'健康记录',family:ui.role==='family'?'写一封暖心留言':'亲友留言',simulation:'护理沟通仿真'};
 return t[ui.page]||t.home;
}
function pageDescription(){
 const d={home:ui.role==='elder'?'简单记录、轻松交流，按自己的节奏生活。':ui.role==='volunteer'?'从倾听开始，在情境中练习关怀。':'看看近况，留下一句惦念。',community:'分享日常，发现生活里的小美好。',care:ui.role==='volunteer'?'选择合适的请求，演示服务响应流程。':'发出一个请求，让陪伴从这里开始。',health:'自主记录的生活与健康信息，仅供交流和自我观察。',family:'让问候跨过距离，温柔抵达。',simulation:'模拟独居长者的情绪变化，练习倾听、识别与转介。'};
 return d[ui.page]||'';
}
function navButton([id,icon,label]){return `<button class="nav-btn ${ui.page===id?'active':''}" data-nav="${id}"><span class="nav-icon">${icon}</span>${label}</button>`}
function shell(content){
 const nav=navs[ui.role]||navs.elder;
 return `<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">☀</div><div><div class="brand-name">青情暖夕阳</div><div class="brand-sub">让陪伴常在身旁</div></div></div><div class="nav-label">菜单导航</div><div class="nav-list">${nav.map(navButton).join('')}</div><div class="sidebar-bottom"><strong>用心相伴，从倾听开始</strong>这是本机演示原型。情绪困扰或健康问题，请联系专业人员；紧急情况请拨打当地急救电话。</div></aside><main class="main"><header class="topbar"><div><div class="top-kicker">QING QING · CARE & COMPANIONSHIP</div><div class="top-date">${today()} · ${roles[ui.role].name}视角</div></div><div class="top-actions"><span class="demo-pill">● 本机演示</span><button class="role-switch" data-role-dialog>切换身份 · ${roles[ui.role].name}⌄</button></div></header><div class="content"><div class="page-head"><div><div class="eyebrow">${ui.page==='simulation'?'INTERACTIVE SIMULATION':'WARM MOMENTS'}</div><h1 class="page-title">${pageTitle()}</h1><p class="page-desc">${pageDescription()}</p></div></div>${content}</div></main></div><nav class="bottom-nav">${nav.map(([id,icon,label])=>`<button data-nav="${id}" class="${ui.page===id?'active':''}"><span>${icon}</span>${label}</button>`).join('')}</nav>${ui.roleDialog?roleDialog():''}${ui.toast?`<div class="toast">${esc(ui.toast)}</div>`:''}`;
}
function roleDialog(){return `<div class="role-overlay"><div class="role-dialog" role="dialog" aria-modal="true" aria-label="选择体验身份"><div class="dialog-head"><div><div class="eyebrow">欢迎来到青情暖夕阳</div><h2 class="card-title" style="font-size:27px;margin-top:8px">选择一个视角开始体验</h2><p class="card-sub">三种身份共用本机演示数据，可随时切换。</p></div>${ui.role?'<button class="close" data-close-dialog aria-label="关闭">×</button>':''}</div><div class="role-grid">${Object.entries(roles).map(([id,r])=>`<button class="role-option" data-role="${id}"><span class="role-emoji">${r.emoji}</span><strong>${r.name}</strong><p>${r.description}</p></button>`).join('')}</div><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px"><p class="helper">此演示不连接真实用户，也不提供医疗诊断或紧急救援服务。</p><button class="section-link" data-reset>重置演示数据</button></div></div></div>`}
function card(title,body,extra=''){return `<section class="card ${extra}"><div class="section-head"><h2>${title}</h2></div>${body}</section>`}
function moodCard(){
 const moods=[['很开心','😊'],['还不错','🙂'],['有点累','😌'],['不太好','😔']];
 return card('今天心情怎么样？',`<p class="card-sub">只需点一下，记录这一刻的感受。</p><div class="mood-row">${moods.map(([name,emoji])=>`<button class="mood-btn ${data.mood===name&&data.moodDate===today()?'selected':''}" data-mood="${name}"><span>${emoji}</span>${name}</button>`).join('')}</div>${data.mood?`<p class="success-line">✓ ${esc(data.moodDate)} 已记录：${esc(data.mood)}</p>`:''}`);
}
function quickCard(icon,color,title,desc,page){return `<button class="card quick-card" data-nav="${page}"><span class="quick-icon ${color}">${icon}</span><span class="quick-text"><strong>${title}</strong><span>${desc}</span></span></button>`}
function elderHome(){
 const latest=data.messages.at(-1);
 return `<div class="grid two"><section class="card hero"><div class="hero-content"><div class="eyebrow">每一天 · 都值得被看见</div><h1>您好，今天想聊聊吗？</h1><p>一句问候、一份记录、一场有温度的交流，让生活多一点期待。</p><button class="button primary" data-nav="care">寻找陪伴 <span>→</span></button></div><div class="hero-art" aria-hidden="true">🌻</div></section>${moodCard()}</div><div class="grid three" style="margin-top:20px">${quickCard('♡','orange','关怀陪伴','发出请求，开启一段暖心交流','care')}${quickCard('＋','green','健康记录','记下今日状态，照顾好自己','health')}${quickCard('✉','blue','亲友留言','看看家人的惦念与问候','family')}</div><div class="grid equal" style="margin-top:20px">${card('给您的一句话',`<div class="notice warm">“陪伴不一定需要很多话，愿意倾听就是最好的开始。”</div><p class="helper">如果持续感到难过，或有伤害自己的想法，请及时联系亲友、专业人员或当地紧急服务。</p>`)}${card('最近的亲友问候',latest?`<div class="list-item"><span class="avatar">💌</span><div class="item-body"><div class="item-top"><strong>${esc(latest.from)}</strong><span class="muted">${esc(latest.time)}</span></div><p>${esc(latest.text)}</p></div></div><button class="section-link" data-nav="family" style="margin-top:15px">查看全部留言 →</button>`:'<div class="empty">还没有留言</div>')}</div>`;
}
function volunteerHome(){const pending=data.requests.filter(r=>r.status==='待回应').length;return `<div class="grid two"><section class="card hero"><div class="hero-content"><div class="eyebrow">VOLUNTEER DESK</div><h1>从一次认真倾听开始</h1><p>在关怀长者之前，先通过情境仿真练习沟通与安全转介。</p><button class="button primary" data-nav="simulation">开始仿真训练 →</button></div><div class="hero-art" aria-hidden="true">🌿</div></section>${card('今日待办',`<div class="stat-strip"><div class="stat"><strong>${pending}</strong><span>待回应请求</span></div><div class="stat"><strong>${data.completed}</strong><span>已完成训练</span></div><div class="stat"><strong>3</strong><span>仿真决策节点</span></div></div><p class="helper">请求接受仅为本机流程演示，不会派遣真实志愿者。</p>`)}</div><div class="grid equal" style="margin-top:20px">${quickCard('♡','orange','查看陪伴请求','了解长者希望获得的陪伴方式','care')}${quickCard('✦','green','沟通情境仿真','练习识别情绪变化与专业转介','simulation')}</div>`}
function familyHome(){return `<div class="grid two"><section class="card hero"><div class="hero-content"><div class="eyebrow">FAMILY CONNECTION</div><h1>关心，随时都能送达</h1><p>看看长者主动记录的近况，再留下一句温柔的问候。</p><button class="button primary" data-nav="family">写一条留言 →</button></div><div class="hero-art" aria-hidden="true">💛</div></section>${card('最近共享状态',`<div class="stat-strip"><div class="stat"><strong>${data.mood?'1':'0'}</strong><span>心情签到</span></div><div class="stat"><strong>${data.health.length}</strong><span>健康记录</span></div><div class="stat"><strong>${data.requests.length}</strong><span>陪伴请求</span></div></div><div class="notice" style="margin-top:18px">${data.mood?`最近心情：${esc(data.mood)} · ${esc(data.moodDate)}`:'长者尚未完成心情签到。'}</div>`)}</div><div class="grid equal" style="margin-top:20px">${quickCard('✉','orange','亲友留言','写下问候，陪伴不会缺席','family')}${quickCard('＋','green','共享近况','查看长者在本机主动记录的信息','health')}</div>`}
function homePage(){return ui.role==='elder'?elderHome():ui.role==='volunteer'?volunteerHome():familyHome()}
function communityPage(){return `<div class="grid two"><div class="stack">${ui.role==='elder'?card('分享此刻',`<form id="post-form"><div class="field"><label for="post-text">今天想和大家分享什么？</label><textarea id="post-text" name="text" maxlength="240" required placeholder="说说今天的小故事……"></textarea></div><button class="button primary" type="submit">发布动态</button></form>`):card('社区公约',`<div class="notice">温暖交流、尊重隐私。不传播未经证实的健康信息，不推荐保健品或药物。</div>`)}${data.posts.slice().reverse().map(p=>`<article class="card"><div class="item-top"><div style="display:flex;gap:10px;align-items:center"><span class="avatar">${p.author==='王阿姨'?'👵':'🌿'}</span><strong>${esc(p.author)}</strong></div><span class="muted">${esc(p.time)}</span></div><p class="post-content">${esc(p.text)}</p><div class="post-actions"><span class="tag">生活分享</span><button class="like ${p.liked?'liked':''}" data-like="${p.id}">${p.liked?'♥':'♡'} ${p.likes}</button></div></article>`).join('')}</div><div class="stack">${card('社区里的温暖',`<p class="card-sub">一个小故事，也可能成为另一位朋友今天的快乐。</p><div class="notice warm" style="margin-top:16px">💡 与长者交流时，先倾听，再回应；尊重每个人的节奏。</div>`)}${card('线下活动提示',`<div class="list-item"><span class="avatar">📚</span><div class="item-body"><strong>读书分享会</strong><p>周六下午 · 社区活动室（示例活动）</p></div></div><p class="helper">活动信息为演示内容，未连接真实社区日程。</p>`)}</div></div>`}
function carePage(){
 const list=data.requests.slice().reverse().map(r=>`<div class="list-item"><span class="avatar">${r.type==='聊天陪伴'?'💬':'🌼'}</span><div class="item-body"><div class="item-top"><strong>${esc(r.type)}</strong><span class="tag ${r.status==='待回应'?'orange':''}">${esc(r.status)}</span></div><p>${esc(r.note||'希望有人聊聊天')}</p><p class="muted">${esc(r.time)} · ${esc(r.created)}</p>${ui.role==='volunteer'&&r.status==='待回应'?`<button class="button secondary small" style="margin-top:10px" data-accept="${r.id}">接受请求</button>`:''}</div></div>`).join('');
 return `<div class="grid two"><div class="stack">${ui.role==='elder'?card('我想要一点陪伴',`<form id="request-form"><div class="field"><label for="request-type">希望怎样交流</label><select id="request-type" name="type"><option>聊天陪伴</option><option>社区活动同行</option><option>电话问候</option></select></div><div class="field-row"><div class="field"><label for="request-time">方便的时间</label><select id="request-time" name="time"><option>今天下午</option><option>明天上午</option><option>周末</option></select></div><div class="field"><label for="request-note">想说的话</label><input id="request-note" name="note" maxlength="60" placeholder="例如：想聊聊养花" /></div></div><button class="button primary" type="submit">发出陪伴请求</button></form><p class="helper">本机演示不会通知真实志愿者。真实服务需经过身份审核和机构协调。</p>`):card('待回应的请求',`<p class="card-sub">接受后请求状态会更新，展示志愿服务响应过程。</p><div class="list">${list||'<div class="empty">暂无请求。切换到长者视角发出一条吧。</div>'}</div>`)}${ui.role==='elder'?card('我的请求',`<div class="list">${list||'<div class="empty">还没有发出请求</div>'}</div>`):''}</div><div class="stack">${card('一次好的陪伴',`<div class="list"><div class="list-item"><span class="avatar">👂</span><div class="item-body"><strong>先倾听</strong><p>让长者自己选择想谈的话题。</p></div></div><div class="list-item"><span class="avatar">🤝</span><div class="item-body"><strong>再回应</strong><p>尊重感受，避免匆忙建议。</p></div></div><div class="list-item"><span class="avatar">🩺</span><div class="item-body"><strong>必要时转介</strong><p>健康或心理风险由专业人员评估。</p></div></div></div>`)}${ui.role==='volunteer'?`<button class="card quick-card" data-nav="simulation"><span class="quick-icon green">✦</span><span class="quick-text"><strong>进入沟通仿真</strong><span>练习如何在真实探访前做出判断</span></span></button>`:''}</div></div>`;
}
function healthPage(){const records=data.health.slice().reverse().map(r=>`<div class="list-item"><span class="avatar">🌱</span><div class="item-body"><div class="item-top"><strong>${esc(r.date)}</strong><span class="tag blue">自主记录</span></div><p>身体感受：${esc(r.feeling)}${r.bp?` · 血压 ${esc(r.bp)}`:''}${r.note?`<br>${esc(r.note)}`:''}</p></div></div>`).join('');return `<div class="grid two"><div class="stack">${ui.role==='elder'?card('记录今天的状态',`<form id="health-form"><div class="field-row"><div class="field"><label for="health-feeling">身体感受</label><select id="health-feeling" name="feeling"><option>状态不错</option><option>有点疲惫</option><option>身体不适</option></select></div><div class="field"><label for="health-bp">血压（可选）</label><input id="health-bp" name="bp" inputmode="numeric" maxlength="7" placeholder="例如 120/80" pattern="[0-9]{2,3}/[0-9]{2,3}" title="请输入类似 120/80 的数值" /></div></div><div class="field"><label for="health-note">补充记录</label><textarea id="health-note" name="note" maxlength="160" placeholder="今天的睡眠、活动或想告诉家人的事……"></textarea></div><button class="button primary" type="submit">保存记录</button></form><p class="helper">数据只保存在当前浏览器，不提供诊断或自动报警。</p>`):card('长者共享的近况',`<div class="notice">这些是长者在同一台设备上主动填写的演示记录。正式产品需经长者授权后才可共享。</div>`)}${card('记录历史',`<div class="list">${records||'<div class="empty">暂时没有记录</div>'}</div>`)}</div><div class="stack">${card('照顾自己的小提醒',`<div class="list"><div class="list-item"><span class="avatar">🥛</span><div class="item-body"><strong>规律生活</strong><p>按自己的身体状况安排休息与活动。</p></div></div><div class="list-item"><span class="avatar">💬</span><div class="item-body"><strong>不适时寻求帮助</strong><p>持续不适请联系医生，紧急情况拨打当地急救电话。</p></div></div></div>`)}${card('当前的心情签到',`<div class="notice warm">${data.mood?`${esc(data.moodDate)} · ${esc(data.mood)}`:'还没有心情签到。'}</div>`)}</div></div>`}
function familyPage(){const msgs=data.messages.slice().reverse().map(m=>`<div class="list-item"><span class="avatar">💌</span><div class="item-body"><div class="item-top"><strong>${esc(m.from)}</strong><span class="muted">${esc(m.time)}</span></div><p>${esc(m.text)}</p></div></div>`).join('');return `<div class="grid two"><div class="stack">${ui.role==='family'?card('写给长者',`<form id="message-form"><div class="field"><label for="message-text">一句问候</label><textarea id="message-text" name="text" maxlength="200" required placeholder="今天想对家人说些什么？"></textarea></div><button class="button primary" type="submit">送出留言</button></form><p class="helper">本机演示留言不会发送到他人设备。</p>`):card('亲友的问候',`<p class="card-sub">忙碌的日子里，也总有人惦记着您。</p>`)}${card('留言记录',`<div class="list">${msgs||'<div class="empty">暂无留言</div>'}</div>`)}</div><div class="stack">${card('陪伴可以很简单',`<div class="notice warm">“今天过得怎么样？”<br>“想听听您最近在做什么。”<br>“周末我们一起聊聊吧。”</div><p class="helper">不必等到特别的日子，平常的问候也很珍贵。</p>`)}${ui.role==='family'?card('长者近况',`<div class="notice">${data.mood?`最近心情：${esc(data.mood)} · ${esc(data.moodDate)}`:'长者尚未签到。'}</div><button class="section-link" data-nav="health" style="margin-top:15px">查看共享记录 →</button>`):''}</div></div>`}
function simulationPage(){
 if(ui.scenarioDone){const score=ui.scenarioScore;return `<div class="stack"><div class="scenario-banner"><div class="scenario-label">SIMULATION COMPLETED</div><h2>完成一次有温度的沟通</h2><p>这是一段教学情境。请将反馈用于讨论与练习，真实服务中依照机构规范和专业人员指导行动。</p></div>${card('本次训练结果',`<div class="score-circle">${score}/3</div><h3 style="text-align:center;color:#36574f">${score===3?'很好地完成了倾听、识别和转介':'继续练习，让每一步更稳妥'}</h3><p class="card-sub" style="text-align:center;margin:8px auto 22px;max-width:500px">关键路径：征得同意并倾听 → 了解情绪与安全风险 → 及时联系专业人员。</p><div class="button-row" style="justify-content:center"><button class="button primary" data-restart>再练一次</button><button class="button ghost" data-nav="home">返回工作台</button></div>`)}${card('决策回顾',`<div class="list">${ui.scenarioHistory.map((choice,i)=>`<div class="list-item"><span class="avatar">${i+1}</span><div class="item-body"><strong>${scenarios[i].phase} · ${scenarios[i].choices[choice].score?'判断得当':'值得改进'}</strong><p>${scenarios[i].choices[choice].feedback}</p></div></div>`).join('')}</div>`)}${card('仿真教学说明',`<p class="card-sub">情境、人物与分数均为教学模拟。分数不代表临床能力认证，也不能替代面对面培训、督导或专业风险评估。</p>`)}</div>`}
 const s=scenarios[ui.scenarioStep],choice=ui.scenarioChoice;
 return `<div class="stack"><div class="scenario-banner"><div class="scenario-label">INTERACTIVE NURSING SCENARIO · 01</div><h2>独居长者的情绪关怀</h2><p>以模拟探访对话呈现护理科普场景。你将面对三次选择，每次即时获得沟通反馈。</p></div><div class="grid two"><section class="card"><div class="step-dots">${scenarios.map((_,i)=>`<span class="${i<=ui.scenarioStep?'active':''}"></span>`).join('')}</div><div class="progress"><i style="width:${((ui.scenarioStep+1)/scenarios.length)*100}%"></i></div><div class="eyebrow">第 ${ui.scenarioStep+1} / ${scenarios.length} 步 · ${s.phase}</div><h2 class="card-title" style="font-size:23px;margin-top:8px">${s.title}</h2>${ui.scenarioStep>0?`<div class="notice" style="margin:12px 0">上一步后：${reactions[ui.scenarioStep-1][ui.scenarioHistory[ui.scenarioStep-1]]}</div>`:''}<p class="card-sub">${s.context}</p><div class="dialogue"><span class="avatar">👵</span><div><strong>王阿姨 · 模拟人物</strong><p>${s.quote}</p></div></div><strong style="color:#456156;font-size:14px">你会怎样回应？</strong><div class="choice-list">${s.choices.map((c,i)=>`<button class="choice ${choice===i?'active':''}" data-choice="${i}" ${choice!==null?'disabled':''}><span class="choice-index">${String.fromCharCode(65+i)}</span>${c.text}</button>`).join('')}</div>${choice!==null?`<div class="feedback ${s.choices[choice].score?'':'needs-work'}"><strong>${s.choices[choice].score?'判断得当':'可以更稳妥'}</strong><br>${s.choices[choice].feedback}</div><button class="button primary" data-next style="margin-top:17px">${ui.scenarioStep===scenarios.length-1?'查看训练结果':'进入下一步'} →</button>`:''}</section><div class="stack">${card('本轮训练目标',`<div class="list"><div class="list-item"><span class="avatar">01</span><div class="item-body"><strong>共情倾听</strong><p>开放提问，尊重长者的表达意愿。</p></div></div><div class="list-item"><span class="avatar">02</span><div class="item-body"><strong>风险识别</strong><p>关注持续的情绪与生活变化。</p></div></div><div class="list-item"><span class="avatar">03</span><div class="item-body"><strong>专业转介</strong><p>按照机构预案寻求专业支持。</p></div></div></div>`)}<div class="notice warm">教学仿真不替代真实护理评估。如遇现实中的即时危险，请联系当地紧急服务。</div></div></div></div>`;
}
function render(){
 if(!ui.role){ui.role='elder'}
 if(!navs[ui.role].some(([id])=>id===ui.page))ui.page='home';
 const pages={home:homePage,community:communityPage,care:carePage,health:healthPage,family:familyPage,simulation:simulationPage};
 document.querySelector('#app').innerHTML=shell(pages[ui.page]());
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.nav){ui.page=b.dataset.nav;window.scrollTo(0,0);render()}
 else if(b.hasAttribute('data-role-dialog')){ui.roleDialog=true;render()}
 else if(b.hasAttribute('data-close-dialog')){ui.roleDialog=false;render()}
 else if(b.dataset.role){ui.role=b.dataset.role;ui.roleDialog=false;ui.page='home';window.scrollTo(0,0);render()}
 else if(b.dataset.mood){data.mood=b.dataset.mood;data.moodDate=today();save();toast('今天的心情已记录')}
 else if(b.dataset.like){const p=data.posts.find(x=>x.id===Number(b.dataset.like));if(p){p.liked=!p.liked;p.likes+=p.liked?1:-1;save();render()}}
 else if(b.dataset.accept){const r=data.requests.find(x=>x.id===Number(b.dataset.accept));if(r){r.status='已接受';save();toast('请求已接受（演示）')}}
 else if(b.dataset.choice!==undefined){if(ui.scenarioChoice===null){ui.scenarioChoice=Number(b.dataset.choice);ui.scenarioHistory.push(ui.scenarioChoice);ui.scenarioScore+=scenarios[ui.scenarioStep].choices[ui.scenarioChoice].score;render()}}
 else if(b.hasAttribute('data-next')){if(ui.scenarioStep===scenarios.length-1){ui.scenarioDone=true;data.completed++;save()}else{ui.scenarioStep++;ui.scenarioChoice=null}render()}
 else if(b.hasAttribute('data-restart')){ui.scenarioStep=0;ui.scenarioChoice=null;ui.scenarioScore=0;ui.scenarioDone=false;ui.scenarioHistory=[];render()}
 else if(b.hasAttribute('data-reset')){data=initialData();save();ui.scenarioStep=0;ui.scenarioChoice=null;ui.scenarioScore=0;ui.scenarioDone=false;ui.scenarioHistory=[];toast('演示数据已重置')}
});
document.addEventListener('submit',e=>{
 const f=e.target;if(!['post-form','request-form','health-form','message-form'].includes(f.id))return;
 e.preventDefault();const v=Object.fromEntries(new FormData(f));
 if(f.id==='post-form'){const text=v.text.trim();if(!text)return;data.posts.push({id:Date.now(),author:'王阿姨',text,time:stamp(),likes:0,liked:false});save();toast('动态已发布')}
 if(f.id==='request-form'){data.requests.push({id:Date.now(),type:v.type,time:v.time,note:v.note.trim(),created:stamp(),status:'待回应'});save();toast('陪伴请求已发出（演示）')}
 if(f.id==='health-form'){data.health.push({id:Date.now(),date:stamp(),feeling:v.feeling,bp:v.bp.trim(),note:v.note.trim()});save();toast('记录已保存')}
 if(f.id==='message-form'){const text=v.text.trim();if(!text)return;data.messages.push({id:Date.now(),from:'亲友',text,time:stamp()});save();toast('留言已保存在本机')}
});
render();

(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}

  /* nav border once scrolled */
  var nav=$('#nav');
  function ns(){nav.classList.toggle('is-stuck',window.scrollY>8)}
  window.addEventListener('scroll',ns,{passive:true}); ns();

  /* return to the top without affecting other anchor links */
  var backToTop=$('.totop');
  if(backToTop){
    backToTop.addEventListener('click',function(e){
      e.preventDefault();
      window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
    });
  }
  /* timeline horizontal controls */
  $$('.story-timeline__carousel').forEach(function(carousel){
    var timeline=$('.story-timeline__list',carousel);
    var controls=$$('.story-timeline__arrow',carousel);
    if(!timeline||!controls.length) return;
    function updateTimelineControls(){
      var maxScroll=timeline.scrollWidth-timeline.clientWidth;
      controls.forEach(function(button){
        var direction=Number(button.getAttribute('data-timeline-direction'));
        button.disabled=direction<0?timeline.scrollLeft<=1:timeline.scrollLeft>=maxScroll-1;
      });
    }
    controls.forEach(function(button){
      button.addEventListener('click',function(){
        var direction=Number(button.getAttribute('data-timeline-direction'));
        timeline.scrollBy({
          left:direction*Math.max(timeline.clientWidth*.75,220),
          behavior:reduce?'auto':'smooth'
        });
      });
    });
    timeline.addEventListener('scroll',updateTimelineControls,{passive:true});
    window.addEventListener('resize',updateTimelineControls);
    updateTimelineControls();
  });
  /* mobile and tablet navigation drawer */
  var navMenu=$('#nav-menu'), navDrawer=$('#nav-drawer');
  if(navMenu&&navDrawer){
    var drawerLinks=$$('.nav-drawer__links a',navDrawer);
    var menuBars=navMenu.querySelectorAll('span');
    function setDrawer(open){
      navDrawer.classList.toggle('is-open',open);
      navMenu.setAttribute('aria-expanded',open?'true':'false');
      menuBars[0].style.top=open?'10px':'3px';
      menuBars[0].style.transform=open?'rotate(45deg)':'none';
      menuBars[1].style.opacity=open?'0':'1';
      menuBars[2].style.top=open?'10px':'17px';
      menuBars[2].style.transform=open?'rotate(-45deg)':'none';
      navDrawer.setAttribute('aria-hidden',open?'false':'true');
      document.body.classList.toggle('nav-drawer-open',open);
    }
    navMenu.addEventListener('click',function(){setDrawer(!navDrawer.classList.contains('is-open'))});
    drawerLinks.forEach(function(link){link.addEventListener('click',function(){setDrawer(false)})});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&navDrawer.classList.contains('is-open')) setDrawer(false)});
  }

  /* wordmark: letters rise in on load */
  var wm=$('#wordmark');
  if(wm){
    var txt=wm.textContent;
    wm.textContent='';
    txt.split('').forEach(function(ch,i){
      var s=document.createElement('span'); s.setAttribute('aria-hidden','true');
      s.style.setProperty('--i',i); s.textContent=ch===' '?' ':ch; wm.appendChild(s);
    });
  }

  /* nav highlights the section in view */
  var links=$$('.nav__links a[href^="#"]:not(.nav__cta)');
  if('IntersectionObserver' in window){
    var map={},visibleSections={};
    links.forEach(function(a){
      var id=a.getAttribute('href').slice(1);
      map[id]={link:a,section:document.getElementById(id)};
      a.classList.remove('is-on');
    });
    var spy=new IntersectionObserver(function(es){
      es.forEach(function(e){
        visibleSections[e.target.id]=e.isIntersecting;
      });
      var activeId=null,nearestDistance=Infinity,viewportCenter=window.innerHeight/2;
      Object.keys(map).forEach(function(id){
        var target=map[id],rect=target.section&&target.section.getBoundingClientRect();
        if(!visibleSections[id]||!rect) return;
        var distance=Math.abs((rect.top+rect.bottom)/2-viewportCenter);
        if(distance<nearestDistance){activeId=id;nearestDistance=distance}
      });
      var activeLink=activeId?map[activeId].link:null;
      links.forEach(function(a){a.classList.toggle('is-on',a===activeLink)});
    },{rootMargin:'-45% 0px -50% 0px'});
    Object.keys(map).forEach(function(id){
      if(map[id].section) spy.observe(map[id].section);
    });
  }

  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(fine && !reduce){
    /* small custom cursor: black by default, blue and outlined over links */
    var cursor=$('#cursor');
    if(cursor){
      document.documentElement.classList.add('cursor-enabled');
      var interactive='a,button,[role="button"],input,textarea,select,summary';
      var cursorX=0,cursorY=0,targetCursorX=0,targetCursorY=0,cursorVelocityX=0,cursorVelocityY=0,cursorRaf=0,cursorReady=false;
      function animateCursor(){
        var dx=targetCursorX-cursorX, dy=targetCursorY-cursorY;
        cursorVelocityX=(cursorVelocityX+dx*.16)*.72;
        cursorVelocityY=(cursorVelocityY+dy*.16)*.72;
        cursorX+=cursorVelocityX;
        cursorY+=cursorVelocityY;
        cursor.style.left=cursorX.toFixed(2)+'px';
        cursor.style.top=cursorY.toFixed(2)+'px';
        if(Math.abs(dx)>.1||Math.abs(dy)>.1||Math.abs(cursorVelocityX)>.1||Math.abs(cursorVelocityY)>.1){
          cursorRaf=requestAnimationFrame(animateCursor);
        }else{
          cursorRaf=0;
        }
      }
      window.addEventListener('pointermove',function(e){
        targetCursorX=e.clientX;
        targetCursorY=e.clientY;
        if(!cursorReady){
          cursorX=targetCursorX;
          cursorY=targetCursorY;
          cursorReady=true;
        }
        if(!cursorRaf) cursorRaf=requestAnimationFrame(animateCursor);
        var hit=e.target.closest ? e.target.closest(interactive) : null;
        cursor.classList.toggle('is-hover',!!hit);
        cursor.classList.toggle('is-link',!!hit && hit.matches('a'));
      });
      window.addEventListener('pointerleave',function(){
        cursor.classList.remove('is-hover','is-link');
      });
    }
    /* hero image: smooth, subtle movement opposite the pointer */
    var hero=$('.hero'), heroImg=$('.hero__photo > img');
    if(hero && heroImg){
      hero.addEventListener('pointermove',function(e){
        var r=hero.getBoundingClientRect();
        var x=((e.clientX-r.left)/r.width-.5)*18;
        var y=((e.clientY-r.top)/r.height-.5)*12;
        heroImg.style.setProperty('--hero-x',x.toFixed(2)+'px');
        heroImg.style.setProperty('--hero-y',y.toFixed(2)+'px');
      });
      hero.addEventListener('pointerleave',function(){
        heroImg.style.setProperty('--hero-x','0px');
        heroImg.style.setProperty('--hero-y','0px');
      });
    }

    /* magnetic buttons and project links */
    $$('.action,.circle').forEach(function(b){
      b.addEventListener('mousemove',function(e){
        var r=b.getBoundingClientRect(), k=b.classList.contains('circle')?.3:.14;
        b.style.transform='translate('+((e.clientX-r.left-r.width/2)*k).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)*k).toFixed(1)+'px)';
      });
      b.addEventListener('mouseleave',function(){b.style.transform=''});
    });
    /* project cards: image drifts with the cursor and a View label follows it */
    var tip=$('#tip'), tx=0, ty=0, cx=0, cy=0, raf=0;
    function loop(){
      cx+=(tx-cx)*.2; cy+=(ty-cy)*.2;
      tip.style.transform='translate('+(cx+18).toFixed(1)+'px,'+(cy+18).toFixed(1)+'px)';
      raf=(Math.abs(tx-cx)>.3||Math.abs(ty-cy)>.3)?requestAnimationFrame(loop):0;
    }
    $$('.case,.cs-gallery-item').forEach(function(c){
      var bg=$('.bg',c), image=$('img',c);
      c.addEventListener('mouseenter',function(){if(tip) tip.classList.add('on')});
      c.addEventListener('mouseleave',function(){
        if(tip) tip.classList.remove('on');
        if(bg){bg.style.setProperty('--tx',0);bg.style.setProperty('--ty',0)}
        if(image){image.style.setProperty('--tx','0px');image.style.setProperty('--ty','0px')}
      });
      c.addEventListener('mousemove',function(e){
        if(tip){tx=e.clientX; ty=e.clientY; if(!raf) raf=requestAnimationFrame(loop)}
        var r=c.getBoundingClientRect();
        if(bg){
          bg.style.setProperty('--tx',(-((e.clientX-r.left)/r.width-.5)*22).toFixed(1));
          bg.style.setProperty('--ty',(-((e.clientY-r.top)/r.height-.5)*22).toFixed(1));
        }
        if(image){
          image.style.setProperty('--tx',(-((e.clientX-r.left)/r.width-.5)*10).toFixed(1)+'px');
          image.style.setProperty('--ty',(-((e.clientY-r.top)/r.height-.5)*10).toFixed(1)+'px');
        }
      });
    });
  }

  /* Oct 8 reveal system: lines, words, images, rules and the quote mark reveal as they enter */
  var rvTargets=[];
  if(!reduce && 'IntersectionObserver' in window){
    document.documentElement.classList.add('js');
    /* headings: each line slides up from a mask */
    $$('.h-xl,.cap-sec__intro h2,.big h2,.cta__title').forEach(function(h){
      var parts=h.innerHTML.split(/<br\s*\/?>/i);
      h.innerHTML=parts.map(function(t,k){return '<span class="ln2" style="--i:'+k+'"><span>'+t+'</span></span>'}).join('');
      rvTargets.push(h);
    });
    $$('.edit h2').forEach(function(h){$$('span',h).forEach(function(sp,k){var i2=$('i',sp); if(i2) i2.style.setProperty('--i',k)}); rvTargets.push(h)});
    /* quote: words slide up one after another */
    var qp=$('.quote__body blockquote p');
    if(qp){
      var words=qp.textContent.trim().split(/\s+/); qp.textContent='';
      words.forEach(function(w,k){var o=document.createElement('span'); o.className='qw'; o.style.setProperty('--w',k); var n=document.createElement('span'); n.textContent=w; o.appendChild(n); qp.appendChild(o); qp.appendChild(document.createTextNode(' '))});
      rvTargets.push(qp);
    }
    var qm=$('.quote__mark'); if(qm) rvTargets.push(qm);
    $$('.rule').forEach(function(r){rvTargets.push(r)});
    /* bring smaller content into view with the same gentle reveal */
    $$('.rise,.arow,.rrow,.capl li,.art,.stats span,.cs-kicker,.cs-title-row,.cs-facts div,.cs-overview-copy>*,.cs-challenges-head>*,.cs-challenge,.cs-gallery,.cs-gallery-head>*,.cs-gallery-item,.cs-priority-list article,.cs-method-body>*,.cs-outcomes-intro>*,.cs-metric-card,.cs-next>a').forEach(function(t,k){
      t.classList.add('scroll-reveal');
      t.style.setProperty('--d',Math.min(k%4,3)*70+'ms');
      rvTargets.push(t);
    });
    var ed=$('.edit'); if(ed) rvTargets.push(ed);
    /* image blocks clip open; their parent is watched because a clipped element is never "visible" */
    var hosts=new Map();
    $$('.case__img,.fig .ph,.color,.studio__img .ph,.art .ph,.cs-gallery-image').forEach(function(el,k){
      el.setAttribute('data-img','');
      var host=el.parentElement; if(!hosts.has(host)) hosts.set(host,[]); hosts.get(host).push(el);
    });
    var rio=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(!e.isIntersecting) return; e.target.classList.add('in'); rio.unobserve(e.target) });
    },{threshold:.15,rootMargin:'0px 0px -6% 0px'});
    rvTargets.forEach(function(t){rio.observe(t)});
    var hio=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(!e.isIntersecting) return; (hosts.get(e.target)||[]).forEach(function(t){t.classList.add('in')}); hio.unobserve(e.target) });
    },{threshold:.1,rootMargin:'0px 0px -6% 0px'});
    hosts.forEach(function(_,h){hio.observe(h)});

    /* nav hides while scrolling down and returns when scrolling up */
    var lastY=0;
    window.addEventListener('scroll',function(){
      var y=scrollY; nav.classList.toggle('hide',y>lastY && y>240); lastY=y;
    },{passive:true});
  }

  /* capability accordion */
  $$('.capl li').forEach(function(li){
    var b=$('button',li);
    b.addEventListener('click',function(){
      var open=li.classList.toggle('is-open');
      b.setAttribute('aria-expanded',open?'true':'false');
    });
  });

  /* stats count up once visible */
  if(!reduce && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return; io.unobserve(e.target);
        var el=e.target, to=+el.dataset.count, t0=performance.now();
        (function step(t){
          var p=Math.min(1,(t-t0)/1200), v=Math.round(to*(1-Math.pow(1-p,3)));
          el.textContent=(v<10?'0':'')+v+(el.dataset.countSuffix||'');
          if(p<1) requestAnimationFrame(step);
        })(t0);
      });
    },{threshold:.6});
    $$('[data-count]').forEach(function(el){io.observe(el)});
  }

  /* copy email */
  var toast=$('#toast'), tt, copyTimer;
  function say(m){toast.textContent=m;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('show')},2200)}
  var comingSoon=$('#comingSoon'), customCursor=$('#cursor');
  if(comingSoon){
    $$('[data-coming-soon]').forEach(function(link){
      link.addEventListener('click',function(e){
        e.preventDefault();
        if(typeof comingSoon.showModal==='function'){
          if(customCursor) comingSoon.appendChild(customCursor);
          comingSoon.showModal();
        }
        else say('This case study is still in the works');
      });
    });
    $$('[data-coming-soon-close]',comingSoon).forEach(function(button){
      button.addEventListener('click',function(){comingSoon.close()});
    });
    comingSoon.addEventListener('click',function(e){
      if(e.target===comingSoon) comingSoon.close();
    });
    comingSoon.addEventListener('close',function(){
      if(customCursor) document.body.appendChild(customCursor);
    });
  }
  function copy(){
    var mail=$('#mailAddr'), addr=mail.dataset.email||mail.textContent.trim();
    function copied(){
      clearTimeout(copyTimer);
      mail.textContent='Copied: '+addr;
      mail.classList.remove('is-copied');
      void mail.offsetWidth;
      mail.classList.add('is-copied');
      say('Copied: '+addr);
      copyTimer=setTimeout(function(){mail.textContent=addr;mail.classList.remove('is-copied')},2200);
    }
    function fb(){
      var r=document.createRange(); r.selectNodeContents(mail);
      var s=getSelection(); s.removeAllRanges(); s.addRange(r); say('Select and copy the address');
      try{if(document.execCommand('copy')) copied()}catch(e){}
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(addr).then(copied,fb);
    } else fb();
  }
  var mailAddr=$('#mailAddr');
  if(mailAddr) mailAddr.addEventListener('click',copy);
})();

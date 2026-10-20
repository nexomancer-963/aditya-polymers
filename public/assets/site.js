(()=>{
  const initialHero=document.querySelector('main > .hero, main > .page-hero');
  if(initialHero&&initialHero.getBoundingClientRect().bottom>0&&initialHero.getBoundingClientRect().top<innerHeight)document.body.classList.add('hero-near');
  document.documentElement.classList.add('js');
  if(new URLSearchParams(location.search).has('layout-audit')){
    document.documentElement.classList.add('layout-audit');
    const markOverflow=()=>document.querySelectorAll('main,main section,.wrap,.hero-content,.section-heading,.section-title,.card-grid > *, .application-grid > *, .contact-grid > *').forEach(element=>{
      const intentional=element.matches('.enquiry')||(element.matches('.wrap')&&(element.querySelector(':scope > .family-tabs')||getComputedStyle(element).overflowX==='auto'));
      element.classList.toggle('layout-overflow',!intentional&&(element.scrollWidth>element.clientWidth+2||(getComputedStyle(element).overflowY==='hidden'&&element.scrollHeight>element.clientHeight+2)));
    });
    if(document.readyState==='complete')requestAnimationFrame(markOverflow);
    else window.addEventListener('load',markOverflow,{once:true});
    window.addEventListener('resize',markOverflow,{passive:true});
  }
  const nav=document.getElementById('main-nav');
  const menuButton=document.getElementById('menu-toggle');
  const head=document.querySelector('.site-head');
  let lastScrollY=window.scrollY;
  let scrollPending=false;
  function revealHead(){head?.classList.remove('nav-hidden')}
  function updateHead(){
    scrollPending=false;
    const y=window.scrollY;
    const difference=y-lastScrollY;
    const busy=nav?.classList.contains('open')||[...document.querySelectorAll('.nav-disclosure .product-menu')].some(menu=>menu.classList.contains('open'))||head?.contains(document.activeElement)||document.getElementById('enquiry-dialog')?.open;
    if(y<100||busy||difference<-3)revealHead();
    else if(y>160&&difference>5)head?.classList.add('nav-hidden');
    lastScrollY=y;
  }
  window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateHead)}},{passive:true});
  head?.addEventListener('focusin',revealHead);
  const disclosures=[...document.querySelectorAll('.nav-disclosure')];
  function closeDisclosure(wrapper){
    const button=wrapper?.querySelector('.nav-trigger[aria-controls]');
    const menu=button&&document.getElementById(button.getAttribute('aria-controls'));
    if(!button||!menu)return;
    menu.classList.remove('open');button.setAttribute('aria-expanded','false');
  }
  function closeDisclosures(except=null){disclosures.forEach(wrapper=>{if(wrapper!==except)closeDisclosure(wrapper)})}
  function closeNav(){if(!nav)return;nav.classList.remove('open');head?.classList.remove('menu-open');menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Open navigation');closeDisclosures()}
  function openDisclosure(wrapper){
    const button=wrapper.querySelector('.nav-trigger[aria-controls]');
    const menu=button&&document.getElementById(button.getAttribute('aria-controls'));
    if(!button||!menu)return false;
    const open=!menu.classList.contains('open');closeDisclosures(wrapper);menu.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));return open;
  }
  menuButton?.addEventListener('click',()=>{revealHead();const open=nav.classList.toggle('open');head?.classList.toggle('menu-open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(!open)closeDisclosures()});
  disclosures.forEach(wrapper=>{
    const button=wrapper.querySelector('.nav-trigger[aria-controls]');
    button?.addEventListener('click',()=>{revealHead();openDisclosure(wrapper)});
    wrapper.addEventListener('focusout',event=>{if(!wrapper.contains(event.relatedTarget))closeDisclosure(wrapper)});
  });
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeNav));
  document.addEventListener('click',event=>{
    const target=event.target;
    disclosures.forEach(wrapper=>{if(target instanceof Node&&!wrapper.contains(target))closeDisclosure(wrapper)});
    if(target instanceof Node&&!head?.contains(target))closeNav();
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const expanded=[...disclosures].find(wrapper=>wrapper.querySelector('.nav-trigger[aria-expanded="true"]'));
    const navWasOpen=nav?.classList.contains('open');
    if(expanded){event.preventDefault();closeDisclosure(expanded);expanded.querySelector('.nav-trigger')?.focus()}
    else if(navWasOpen){event.preventDefault();closeNav();menuButton?.focus()}
  });

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visualFrame=0;
  let updateParallaxFrame=()=>{};
  let updateFamilyProgressFrame=()=>{};
  function scheduleVisualFrame(){
    if(visualFrame)return;
    visualFrame=requestAnimationFrame(()=>{
      visualFrame=0;
      updateParallaxFrame();
      updateFamilyProgressFrame();
    });
  }
  const parallaxImages=[...document.querySelectorAll('.hero-visual img, .application-card img, .material-photo img, .family-media img, .hero-image img, .feature-image img, .phase7-application-card img, .surface-card.has-image img')];
  if(parallaxImages.length&&'matchMedia' in window){
    parallaxImages.forEach(image=>image.classList.add('parallax-image'));
    const motionPreference=matchMedia('(prefers-reduced-motion: no-preference)');
    let parallaxEnabled=false;
    updateParallaxFrame=()=>{
      if(!parallaxEnabled)return;
      const viewportHeight=window.innerHeight||1;
      const amplitude=window.innerWidth<=700?4:8;
      parallaxImages.forEach(image=>{
        const frame=image.parentElement;
        if(!frame)return;
        const bounds=frame.getBoundingClientRect();
        if(bounds.bottom<0||bounds.top>viewportHeight){
          image.style.setProperty('--parallax-y','0px');
          return;
        }
        const distance=(viewportHeight/2-(bounds.top+bounds.height/2))/viewportHeight;
        image.style.setProperty('--parallax-y',`${Math.max(-amplitude,Math.min(amplitude,distance*amplitude*2)).toFixed(2)}px`);
      });
    };
    function syncParallax(){
      parallaxEnabled=motionPreference.matches;
      document.documentElement.classList.toggle('parallax-ready',parallaxEnabled);
      if(parallaxEnabled)updateParallaxFrame();
      else{
        parallaxImages.forEach(image=>image.style.removeProperty('--parallax-y'));
      }
    }
    window.addEventListener('scroll',scheduleVisualFrame,{passive:true});
    window.addEventListener('resize',()=>{syncParallax();scheduleVisualFrame()},{passive:true});
    motionPreference.addEventListener?.('change',syncParallax);
    syncParallax();
  }
  const tabs=[...document.querySelectorAll('.family-tabs .family-tab')];
  const tabRail=document.querySelector('.family-tabs');
  const panels=[...document.querySelectorAll('.family-panel[role="tabpanel"]')];
  if(tabs.length){
    const familyProgress=document.createElement('div');
    familyProgress.className='family-progress';
    familyProgress.setAttribute('aria-hidden','true');
    const familyProgressFill=document.createElement('span');
    familyProgressFill.className='family-progress-fill';
    familyProgress.append(familyProgressFill);
    tabRail.insertAdjacentElement('afterend',familyProgress);
    updateFamilyProgressFrame=()=>{
      const maxScroll=tabRail.scrollWidth-tabRail.clientWidth;
      const hasOverflow=maxScroll>1;
      const compact=matchMedia('(max-width: 650px)').matches;
      familyProgress.hidden=!hasOverflow&&!compact;
      if(compact){
        const selectedIndex=Math.max(0,tabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true'));
        familyProgressFill.style.setProperty('--family-progress',String((selectedIndex+1)/tabs.length));
      }else if(hasOverflow)familyProgressFill.style.setProperty('--family-progress',String(.16+.84*Math.max(0,Math.min(1,tabRail.scrollLeft/maxScroll))));
    };
    tabRail.addEventListener('scroll',scheduleVisualFrame,{passive:true});
    window.addEventListener('resize',scheduleVisualFrame,{passive:true});
    function selectFamily(name,focus=false){
      const selected=tabs.find(tab=>tab.dataset.tab===name)||tabs[0];
      tabs.forEach(tab=>{
        const active=tab===selected;
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex=active?0:-1;
        if(active&&focus)tab.focus();
      });
      panels.forEach(panel=>{panel.hidden=panel.id!==`panel-${selected.dataset.tab}`});
      if(focus)selected.scrollIntoView({block:'nearest',inline:'nearest'});
      scheduleVisualFrame();
    }
    const initial=tabs.find(tab=>tab.getAttribute('aria-selected')==='true')||tabs[0];
    if(tabRail)tabRail.scrollLeft=0;
    selectFamily(initial.dataset.tab);
    updateFamilyProgressFrame();
    tabs.forEach(tab=>{
      tab.addEventListener('click',()=>selectFamily(tab.dataset.tab));
      tab.addEventListener('keydown',event=>{
        const index=tabs.indexOf(tab);
        let next;
        if(event.key==='ArrowRight')next=(index+1)%tabs.length;
        else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
        else if(event.key==='Home')next=0;
        else if(event.key==='End')next=tabs.length-1;
        else return;
        event.preventDefault();
        selectFamily(tabs[next].dataset.tab,true);
      });
    });
  }

  document.querySelectorAll('.phase7-application-rail').forEach(rail=>{
    const cards=[...rail.querySelectorAll(':scope > .phase7-application-card')];
    if(cards.length<2)return;
    const controls=document.createElement('div');
    controls.className='phase7-rail-controls';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','Application carousel controls');
    const count=document.createElement('span');
    count.className='phase7-rail-count';
    count.setAttribute('aria-live','polite');
    const progress=document.createElement('span');
    progress.className='phase7-rail-progress';
    progress.setAttribute('aria-hidden','true');
    const fill=document.createElement('span');
    fill.className='phase7-rail-progress-fill';
    progress.append(fill);
    const previous=document.createElement('button');
    previous.type='button';
    previous.className='phase7-rail-button';
    previous.setAttribute('aria-label','Previous application');
    previous.textContent='\u2190';
    const next=document.createElement('button');
    next.type='button';
    next.className='phase7-rail-button';
    next.setAttribute('aria-label','Next application');
    next.textContent='\u2192';
    const hint=document.createElement('span');
    hint.className='phase7-rail-hint';
    hint.setAttribute('aria-hidden','true');
    const hintText=document.createElement('span');
    const hintArrow=document.createElement('span');
    hintArrow.className='phase7-rail-hint-arrow';
    hintArrow.setAttribute('aria-hidden','true');
    hint.append(hintText,hintArrow);
    controls.append(count,progress,previous,next);
    rail.append(hint);
    rail.insertAdjacentElement('afterend',controls);
    let active=0;
    let gesture=null;
    let suppressClickUntil=0;
    const mobile=matchMedia('(max-width: 650px)');
    const update=()=>{
      const compact=mobile.matches;
      controls.hidden=!compact;
      rail.classList.toggle('is-carousel',compact);
      cards.forEach((card,index)=>{
        if(compact){
          const selected=index===active;
          card.dataset.active=String(selected);
          card.inert=!selected;
          card.setAttribute('aria-hidden',String(!selected));
        }else{
          card.removeAttribute('data-active');
          card.inert=false;
          card.removeAttribute('aria-hidden');
        }
      });
      if(!compact)return;
      count.textContent=`${String(active+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
      fill.style.setProperty('--application-progress',String((active+1)/cards.length));
      previous.disabled=active===0;
      next.disabled=active===cards.length-1;
      hintText.textContent=active===0?'Swipe left for next':active===cards.length-1?'Swipe right to go back':'Swipe left or right';
      hintArrow.textContent=active===cards.length-1?'\u2192':active===0?'\u2190':'\u2194';
      hint.dataset.direction=active===cards.length-1?'right':'left';
    };
    const goTo=index=>{
      if(!mobile.matches)return;
      const target=Math.max(0,Math.min(cards.length-1,index));
      if(target!==active){active=target;update()}
    };
    previous.addEventListener('click',()=>goTo(active-1));
    next.addEventListener('click',()=>goTo(active+1));
    rail.addEventListener('pointerdown',event=>{
      if(mobile.matches&&event.button===0)gesture={id:event.pointerId,x:event.clientX,y:event.clientY};
    },{passive:true});
    window.addEventListener('pointerup',event=>{
      if(!gesture||event.pointerId!==gesture.id)return;
      const dx=event.clientX-gesture.x;
      const dy=event.clientY-gesture.y;
      gesture=null;
      if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.2)return;
      suppressClickUntil=performance.now()+650;
      goTo(active+(dx<0?1:-1));
    },{passive:true});
    window.addEventListener('pointercancel',()=>{gesture=null},{passive:true});
    rail.addEventListener('click',event=>{
      if(performance.now()<suppressClickUntil){event.preventDefault();event.stopPropagation()}
    },true);
    mobile.addEventListener('change',update);
    update();
    if('IntersectionObserver' in window){
      const cue=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){rail.classList.add('is-cued');cue.disconnect()}
      },{threshold:.5});
      cue.observe(rail);
    }else rail.classList.add('is-cued');
  });

  const revealNodes=[...document.querySelectorAll('[data-reveal]')];
  const bondIllustrations=[...document.querySelectorAll('.bond-path')];
  const footer=document.querySelector('.site-footer');
  const hero=document.querySelector('main > .hero, main > .page-hero');
  if(hero&&'IntersectionObserver' in window){
    const heroObserver=new IntersectionObserver(entries=>{
      const entry=entries.find(item=>item.target===hero);
      if(entry)document.body.classList.toggle('hero-near',entry.isIntersecting);
    },{threshold:0});
    heroObserver.observe(hero);
  }
  if(footer&&'IntersectionObserver' in window){
    const footerObserver=new IntersectionObserver(entries=>{
      const entry=entries.find(item=>item.target===footer);
      if(entry)document.body.classList.toggle('footer-near',entry.isIntersecting);
    },{threshold:0});
    footerObserver.observe(footer);
  }
  const legacyRevealNodes=[...document.querySelectorAll('.page-hero .hero-layout > *, .section-title, .technical-record, .split-feature, .contact-card, .process article')];
  legacyRevealNodes.forEach((node,index)=>{
    node.classList.add('reveal-node');
    if(node.matches('.technical-record, .process article'))node.style.setProperty('--reveal-delay',`${(index%4)*55}ms`);
  });
  const motionTargets=[...new Set([...revealNodes,...bondIllustrations,...legacyRevealNodes])];
  if(!reduced&&'IntersectionObserver' in window){
    document.documentElement.classList.add('motion-ready');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add(entry.target.matches('.reveal-node')?'revealed':'in-view');
        if(entry.target.matches('.bond-path'))entry.target.style.setProperty('--progress','100%');
        observer.unobserve(entry.target);
      }
    }),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    motionTargets.forEach(node=>observer.observe(node));
  }else{
    motionTargets.forEach(node=>node.classList.add(node.matches('.reveal-node')?'revealed':'in-view'));
    bondIllustrations.forEach(node=>node.style.setProperty('--progress','100%'));
  }

  document.querySelectorAll('.application-card').forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(reduced||event.pointerType==='touch')return;
      const box=card.getBoundingClientRect();
      card.style.setProperty('--tilt-x',`${((event.clientY-box.top)/box.height-.5)*-3}deg`);
      card.style.setProperty('--tilt-y',`${((event.clientX-box.left)/box.width-.5)*3}deg`);
    });
    card.addEventListener('pointerleave',()=>{card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')});
  });

  const dialog=document.getElementById('enquiry-dialog');
  if(!dialog)return;
  const form=dialog.querySelector('form');
  const prepared=dialog.querySelector('.prepared');
  const summary=dialog.querySelector('#enquiry-summary');
  const status=dialog.querySelector('.form-status');
  const scroll=dialog.querySelector('.enquiry-scroll');
  const rail=dialog.querySelector('.dialog-scroll-rail');
  const familyTrigger=dialog.querySelector('#product-trigger');
  const familyOptions=dialog.querySelector('#product-options');
  const familyItems=[...familyOptions.querySelectorAll('[role="option"]')];
  const familyValue=form.elements.product;
  const familyError=dialog.querySelector('#eq-product-error');
  const dialogTitle=dialog.querySelector('#dialog-title');
  const dialogEyebrow=dialog.querySelector('.dialog-head .overline');
  const dialogIntro=dialog.querySelector('.dialog-head p');
  const materialLabel=dialog.querySelector('label[for="eq-application"]');
  const materialInput=form.elements.application;
  const materialHelp=materialInput.closest('.field').querySelector('small');
  const processLabel=dialog.querySelector('label[for="eq-message"]');
  const processInput=form.elements.message;
  const contextField=document.createElement('input');
  contextField.type='hidden';contextField.name='context';form.prepend(contextField);
  const contextCard=document.createElement('div');
  contextCard.className='enquiry-context-card';
  contextCard.innerHTML='<span class="enquiry-context-label">Enquiry focus</span><strong class="enquiry-context-value"></strong><p class="enquiry-context-guidance"></p>';
  form.insertBefore(contextCard,form.querySelector('.form-grid'));
  dialogIntro.id='dialog-description';dialog.setAttribute('aria-describedby','dialog-description');
  let returnFocus=null;
  function closeFamily(restoreFocus=false){if(familyOptions.hidden)return;familyOptions.hidden=true;familyTrigger.setAttribute('aria-expanded','false');if(restoreFocus)familyTrigger.focus()}
  function positionFamily(){if(familyOptions.hidden)return;const trigger=familyTrigger.getBoundingClientRect();const frame=dialog.getBoundingClientRect();const availableBelow=frame.bottom-trigger.bottom-17;const availableAbove=trigger.top-frame.top-17;const above=availableBelow<180&&availableAbove>availableBelow;const room=above?availableAbove:availableBelow;familyOptions.style.left=`${trigger.left-frame.left}px`;familyOptions.style.width=`${trigger.width}px`;familyOptions.style.maxHeight=`${Math.max(120,Math.min(326,room-7))}px`;familyOptions.style.top=`${(above?trigger.top-familyOptions.offsetHeight-7:trigger.bottom+7)-frame.top}px`;familyOptions.classList.toggle('above',above)}
  function openFamily(focusFirst=false){familyOptions.hidden=false;familyTrigger.setAttribute('aria-expanded','true');positionFamily();if(focusFirst)(familyItems.find(item=>item.dataset.value===familyValue.value)||familyItems[0]).focus()}
  function chooseFamily(item){familyValue.value=item.dataset.value;familyTrigger.querySelector('.family-trigger-value').textContent=item.querySelector('span').textContent;familyItems.forEach(option=>option.setAttribute('aria-selected',String(option===item)));familyTrigger.removeAttribute('aria-invalid');familyError.hidden=true;closeFamily(true)}
  familyTrigger.addEventListener('click',()=>familyOptions.hidden?openFamily():closeFamily());
  familyTrigger.addEventListener('keydown',event=>{if(event.key==='Escape'&&!familyOptions.hidden){event.preventDefault();event.stopPropagation();closeFamily(true)}else if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();openFamily(true)}});
  familyOptions.addEventListener('click',event=>{const item=event.target.closest('[role="option"]');if(item)chooseFamily(item)});
  familyOptions.addEventListener('keydown',event=>{const index=familyItems.indexOf(document.activeElement);let next=index;if(event.key==='ArrowDown')next=(index+1)%familyItems.length;else if(event.key==='ArrowUp')next=(index-1+familyItems.length)%familyItems.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=familyItems.length-1;else if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseFamily(familyItems[index]);return}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeFamily(true);return}else if(event.key==='Tab'){closeFamily();return}else return;event.preventDefault();familyItems[next].focus()});
  dialog.addEventListener('click',event=>{if(!familyOptions.hidden&&!event.target.closest('.family-options')&&!event.target.closest('.family-trigger'))closeFamily()});
  function updateRail(){if(!scroll||!rail)return;dialog.style.setProperty('--head-edge',`${Math.max(0,dialog.querySelector('.dialog-head').offsetHeight-scroll.scrollTop)}px`);const range=scroll.scrollHeight-scroll.clientHeight;dialog.classList.toggle('is-scrollable',range>1);dialog.style.setProperty('--progress',String(range>1?Math.max(.08,Math.min(1,(scroll.scrollTop+scroll.clientHeight)/scroll.scrollHeight)):1))}
  scroll?.addEventListener('scroll',()=>{positionFamily();updateRail()},{passive:true});window.addEventListener('resize',()=>{positionFamily();updateRail()});
  function setFamily(value){
    const item=familyItems.find(option=>option.dataset.value===value);
    familyValue.value=item?.dataset.value||'';
    familyTrigger.querySelector('.family-trigger-value').textContent=item?item.querySelector('span').textContent:'Choose a family';
    familyItems.forEach(option=>option.setAttribute('aria-selected',String(option===item)));
    familyTrigger.removeAttribute('aria-invalid');familyError.hidden=true;
  }
  function enquiryContext(trigger){
    const grade=trigger.dataset.grade;
    const application=trigger.dataset.application;
    const product=trigger.dataset.product;
    if(grade){
      const cold=grade==='CL 150';
      return {
        kind:'grade',topic:`Dr. Bond ${grade}`,product:product||'Starch based adhesives',
        title:`Discuss ${grade}.`,eyebrow:'Grade enquiry',
        intro:cold?'Tell us what you make and how you mix CL 150 on your line.':'Tell us which DEXO grade or tube format you use and what heating equipment is available.',
        guidance:cold?'Cold mixing for tubes, cores, edge guards or fibre drums.':'Hot mixing for paper or textile tubes.',
        materialLabel:'Product format and materials *',materialPlaceholder:cold?'e.g. kraft paper tubes and cores':'e.g. paper or textile tubes',
        materialHelp:'Name the finished product and materials being joined.',
        processLabel:'Mixing process and requirement *',processPlaceholder:cold?'Describe your cold mixing process, application method and line conditions.':'Describe your cooking or heating equipment, application method and line conditions.'
      };
    }
    if(application){
      const guidance={
        'Paper conversion':'Tubes, cores, cans, edge guards or fibre drums.',
        'Packaging and corrugation':'Corrugated board, carton side pasting or box making.',
        'Lamination and labeling':'Tell us the surfaces, coating and line method.',
        'Furniture and interiors':'Tell us the wood surfaces and intended use.'
      }[application]||'Tell us about the finished product and process.';
      return {kind:'application',topic:application,product:'Not sure yet',title:`Discuss ${application.toLowerCase()}.`,eyebrow:'Application enquiry',
        intro:'Start with the work you are doing. We can discuss which product family may fit.',guidance,
        materialLabel:'Materials and finished product *',materialPlaceholder:'e.g. kraft paper to paper core',
        materialHelp:'Name both surfaces and the item you make.',processLabel:'Application method and requirement *',
        processPlaceholder:'Describe your equipment, application method and the result you need.'};
    }
    if(product){
      return {kind:'product',topic:product,product,title:`Discuss ${product.toLowerCase()}.`,eyebrow:'Product family enquiry',
        intro:'Share your materials, equipment and the result you need from this product family.',
        guidance:'The product family is selected below. You can change it if needed.',
        materialLabel:'Materials this adhesive will join *',materialPlaceholder:'e.g. coated board to corrugated board',
        materialHelp:'Name both surfaces and any coating.',processLabel:'Your process and requirement *',
        processPlaceholder:'Describe how the adhesive is applied, line conditions and the result you need.'};
    }
    if(trigger.dataset.enquiryKind==='application-general'){
      return {kind:'application',topic:'Application enquiry',product:'Not sure yet',title:'Prepare an application enquiry.',eyebrow:'Application enquiry',
        intro:'Describe the finished product and your production process. We can discuss a suitable product route.',
        guidance:'Start with the materials and the application method.',
        materialLabel:'Materials and finished product *',materialPlaceholder:'e.g. paper board and corrugated box',
        materialHelp:'Name both surfaces and the item you make.',processLabel:'Application method and requirement *',
        processPlaceholder:'Describe the equipment, method and conditions on your line.'};
    }
    if(trigger.dataset.enquiryKind==='product-selection'){
      return {kind:'product',topic:'Product selection',product:'',title:'Prepare a product enquiry.',eyebrow:'Product enquiry',
        intro:'Tell us what you are making and choose a product family if you know it.',
        guidance:'You can select “Not sure yet” if you need help choosing.',
        materialLabel:'Materials being joined *',materialPlaceholder:'e.g. kraft paper to paper tube',
        materialHelp:'Name both surfaces and any coating.',processLabel:'Process and requirement *',
        processPlaceholder:'Describe your process, current challenge and relevant conditions.'};
    }
    return {kind:'general',topic:'General adhesive requirement',product:'',title:'Discuss a requirement.',eyebrow:'Start an enquiry',
      intro:'Tell us what needs to bond, how you apply the adhesive and what result you need.',
      guidance:'Share what you know. A grade name is optional.',
      materialLabel:'Materials being joined *',materialPlaceholder:'e.g. kraft paper to paper tube',
      materialHelp:'Name both surfaces and any coating.',processLabel:'Process and requirement *',
      processPlaceholder:'Describe your process, current challenge and relevant conditions.'};
  }
  function openDialog(trigger){
    revealHead();returnFocus=trigger;closeFamily();form.reset();form.hidden=false;prepared.classList.remove('show');
    const context=enquiryContext(trigger);
    dialog.dataset.enquiryKind=context.kind;contextField.value=context.topic;
    dialogTitle.textContent=context.title;dialogEyebrow.textContent=context.eyebrow;dialogIntro.textContent=context.intro;
    contextCard.querySelector('.enquiry-context-value').textContent=context.topic;
    contextCard.querySelector('.enquiry-context-guidance').textContent=context.guidance;
    materialLabel.textContent=context.materialLabel;materialInput.placeholder=context.materialPlaceholder;materialHelp.textContent=context.materialHelp;
    processLabel.textContent=context.processLabel;processInput.placeholder=context.processPlaceholder;
    setFamily(context.product);form.querySelector('.form-status').textContent='';
    const rescue=form.querySelector('.form-rescue');if(rescue)rescue.hidden=true;
    dialog.showModal();document.body.classList.add('modal-open');scroll.scrollTop=0;
    dialog.querySelector('.dialog-close').focus();requestAnimationFrame(updateRail);
  }
  document.querySelectorAll('[data-enquiry]').forEach(trigger=>trigger.addEventListener('click',event=>{event.preventDefault();openDialog(trigger)}));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  dialog.addEventListener('cancel',event=>{if(!familyOptions.hidden){event.preventDefault();closeFamily(true)}});
  dialog.addEventListener('close',()=>{closeFamily();document.body.classList.remove('modal-open');returnFocus?.focus()});
  const formFeedback=document.createElement('p');
  formFeedback.className='form-status';formFeedback.setAttribute('role','status');
  form.querySelector('.form-actions').append(formFeedback);
  const rescue=document.createElement('section');
  rescue.className='form-rescue';rescue.hidden=true;
  const rescueTitle=document.createElement('h3');rescueTitle.textContent='Keep your enquiry details';
  const rescueIntro=document.createElement('p');rescueIntro.textContent='The form could not send. Copy these details before closing it, or edit the form and try again.';
  const rescueBrief=document.createElement('pre');rescueBrief.tabIndex=0;
  const rescueCopy=document.createElement('button');rescueCopy.type='button';rescueCopy.className='btn btn-ice';rescueCopy.textContent='Copy enquiry details';
  const rescueStatus=document.createElement('p');rescueStatus.className='form-status';rescueStatus.setAttribute('role','status');
  rescue.append(rescueTitle,rescueIntro,rescueBrief,rescueCopy,rescueStatus);form.append(rescue);
  function updateSummary(){
    const data=new FormData(form);
    const fields=[['Enquiry focus',data.get('context')],['Name',data.get('name')],['Company',data.get('company')],['Email',data.get('email')],['Phone',data.get('phone')],['Product family',data.get('product')],['Application / substrates',data.get('application')],['Process and requirement',data.get('message')]];
    summary.textContent=fields.filter(([,value])=>value).map(([label,value])=>label+': '+String(value).trim()).join('\n');
    rescueBrief.textContent=summary.textContent;
    return data;
  }
  rescueCopy.addEventListener('click',async()=>{updateSummary();try{await navigator.clipboard.writeText(rescueBrief.textContent);rescueStatus.textContent='Enquiry details copied.'}catch{rescueStatus.textContent='Copy is unavailable here. Select the details above to copy them manually.'}});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!familyValue.value){familyTrigger.setAttribute('aria-invalid','true');familyError.hidden=false;familyTrigger.focus();return}if(!form.reportValidity())return;
    const data=updateSummary();rescue.hidden=true;rescueStatus.textContent='';
    const submit=form.querySelector('[type="submit"]');submit.disabled=true;formFeedback.textContent='Sending your enquiry…';
    try{
      const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(data)),cache:'no-store'});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.message||'We could not send the enquiry. Please try again.');
      rescue.hidden=true;form.hidden=true;prepared.classList.add('show');prepared.querySelector('h3').textContent='Enquiry received.';
      prepared.querySelector('p').textContent='Your requirement has been sent to our team. Keep a copy for your records.';
      formFeedback.textContent='';scroll.scrollTop=0;prepared.querySelector('button').focus();requestAnimationFrame(updateRail);
    }catch(error){formFeedback.textContent=error instanceof Error?error.message:'We could not send the enquiry. Please try again.';rescue.hidden=false;requestAnimationFrame(updateRail)}
    finally{submit.disabled=false}
  });
  dialog.querySelector('#copy-enquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary.textContent);status.textContent='Copied. You can paste this into your email or brief.'}catch{status.textContent='Select the request above to copy it manually.'}});
  dialog.querySelector('#edit-enquiry').addEventListener('click',()=>{prepared.classList.remove('show');form.hidden=false;status.textContent='';form.elements.name.focus();requestAnimationFrame(updateRail)});
})();

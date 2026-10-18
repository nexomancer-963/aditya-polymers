(()=>{
  const nav=document.getElementById('main-nav');
  const menuButton=document.getElementById('menu-toggle');
  const productButton=document.getElementById('products-toggle');
  const productMenu=document.getElementById('products-menu');
  const head=document.querySelector('.site-head');
  let lastScrollY=window.scrollY;
  let scrollPending=false;
  function revealHead(){head?.classList.remove('nav-hidden')}
  function updateHead(){scrollPending=false;const y=window.scrollY;const difference=y-lastScrollY;const busy=nav?.classList.contains('open')||productMenu?.classList.contains('open')||head?.contains(document.activeElement)||document.getElementById('enquiry-dialog')?.open;if(y<100||busy||difference<-3)revealHead();else if(y>160&&difference>5)head?.classList.add('nav-hidden');lastScrollY=y}
  window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateHead)}},{passive:true});
  head?.addEventListener('focusin',revealHead);
  function closeProducts(){if(!productMenu)return;productMenu.classList.remove('open');productButton.setAttribute('aria-expanded','false')}
  function closeNav(){if(!nav)return;nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');closeProducts()}
  menuButton?.addEventListener('click',()=>{revealHead();const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(!open)closeProducts()});
  productButton?.addEventListener('click',()=>{revealHead();const open=productMenu.classList.toggle('open');productButton.setAttribute('aria-expanded',String(open))});
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeNav));
  document.addEventListener('click',event=>{if(!event.target.closest('.nav-products'))closeProducts();if(!event.target.closest('.site-head'))closeNav()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){const productsWereOpen=productMenu?.classList.contains('open');const navWasOpen=nav?.classList.contains('open');closeNav();if(productsWereOpen)productButton.focus();else if(navWasOpen)menuButton.focus()}});
  productMenu?.addEventListener('focusout',event=>{if(!event.currentTarget.parentElement.contains(event.relatedTarget))closeProducts()});
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
  function openDialog(trigger){revealHead();returnFocus=trigger;dialog.showModal();document.body.classList.add('modal-open');scroll.scrollTop=0;const suggested=trigger.dataset.product||'';const item=familyItems.find(option=>option.dataset.value===suggested);if(item){familyValue.value=item.dataset.value;familyTrigger.querySelector('.family-trigger-value').textContent=item.querySelector('span').textContent;familyItems.forEach(option=>option.setAttribute('aria-selected',String(option===item)))}dialog.querySelector('.dialog-close').focus();requestAnimationFrame(updateRail)}
  document.querySelectorAll('[data-enquiry]').forEach(trigger=>trigger.addEventListener('click',event=>{event.preventDefault();openDialog(trigger)}));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  dialog.addEventListener('cancel',event=>{if(!familyOptions.hidden){event.preventDefault();closeFamily(true)}});
  dialog.addEventListener('close',()=>{closeFamily();document.body.classList.remove('modal-open');returnFocus?.focus()});
  const formFeedback=document.createElement('p');
  formFeedback.className='form-status';formFeedback.setAttribute('role','status');
  form.querySelector('.form-actions').append(formFeedback);
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!familyValue.value){familyTrigger.setAttribute('aria-invalid','true');familyError.hidden=false;familyTrigger.focus();return}if(!form.reportValidity())return;
    const data=new FormData(form);
    const fields=[['Name',data.get('name')],['Company',data.get('company')],['Email',data.get('email')],['Phone',data.get('phone')],['Product family',data.get('product')],['Application / substrates',data.get('application')],['Process and requirement',data.get('message')]];
    summary.textContent=fields.filter(([,value])=>value).map(([label,value])=>label+': '+String(value).trim()).join('\n');
    const submit=form.querySelector('[type="submit"]');submit.disabled=true;formFeedback.textContent='Sending your enquiry…';
    try{
      const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(data)),cache:'no-store'});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.message||'We could not send the enquiry. Please try again.');
      form.hidden=true;prepared.classList.add('show');prepared.querySelector('h3').textContent='Enquiry received.';
      prepared.querySelector('p').textContent='Your requirement has been sent to our team. Keep a copy for your records.';
      formFeedback.textContent='';scroll.scrollTop=0;prepared.querySelector('button').focus();requestAnimationFrame(updateRail);
    }catch(error){formFeedback.textContent=error instanceof Error?error.message:'We could not send the enquiry. Please try again.'}
    finally{submit.disabled=false}
  });
  dialog.querySelector('#copy-enquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary.textContent);status.textContent='Copied. You can paste this into your email or brief.'}catch{status.textContent='Select the request above to copy it manually.'}});
  dialog.querySelector('#edit-enquiry').addEventListener('click',()=>{prepared.classList.remove('show');form.hidden=false;status.textContent='';form.elements.name.focus();requestAnimationFrame(updateRail)});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced&&'IntersectionObserver' in window){
    const nodes=[...document.querySelectorAll('.page-hero .hero-layout > *, .section-title, .technical-record, .split-feature, .contact-card, .process article')];
    nodes.forEach((node,index)=>{node.classList.add('reveal-node');if(node.matches('.technical-record, .process article'))node.style.setProperty('--reveal-delay',`${(index%4)*55}ms`)});
    document.documentElement.classList.add('motion-ready');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    nodes.forEach(node=>observer.observe(node));
  }
})();

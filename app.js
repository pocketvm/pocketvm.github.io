'use strict';
const $ = id => document.getElementById(id);
let vm = null, state = 'idle', pendingAction = null;
function render(next, message) {
  state = next;
  $('status').textContent = '● ' + ({idle:'Ready',loading:'Loading',running:'Running',paused:'Paused',error:'Error'}[state]);
  $('message').textContent = message;
  $('configuration').disabled = !!vm || state === 'loading';
  $('start').disabled = !!vm || state === 'loading';
  $('end').disabled = !vm;
  for (const id of ['pause','restart','fullscreen','cad']) $(id).disabled = !['running','paused'].includes(state);
  $('pause').textContent = state === 'paused' ? 'Resume' : 'Pause';
}
$('source').onchange = () => { $('local-options').hidden = $('source').value !== 'local'; };
$('disk').onchange = () => { if ($('disk').files[0]?.name.toLowerCase().endsWith('.iso')) $('kind').value = 'cdrom'; };
async function dispose() {
  if (document.pointerLockElement === $('display')) document.exitPointerLock();
  const previous = vm; vm = null;
  if (previous) await previous.destroy();
  $('screen_container').innerHTML = '<div style="white-space:pre;font:14px monospace;line-height:14px"></div><canvas style="display:none"></canvas>';
  $('screen_container').hidden = true; $('empty').hidden = false;
}
async function fail(error) {
  try { await dispose(); } catch (_) { /* Preserve the original error. */ }
  render('error', error?.message || 'Unable to load this machine. Try again.');
}
$('start').onclick = async () => {
  if (state === 'loading' || vm) return;
  const local = $('source').value === 'local', file = $('disk').files[0];
  if (local && !file) { render('idle','Choose a disk image first.'); $('disk').focus(); return; }
  if (local && file.size > 512 * 1024 * 1024) { render('idle','Choose an image under 512 MB for this browser runner.'); return; }
  render('loading','Preparing machine…');
  try {
    if (typeof V86 !== 'function') throw new Error('Emulator could not load. Serve this folder through GitHub Pages or a local web server.');
    const options = {
      wasm_path:'vendor/v86.wasm', memory_size:Number($('memory').value)*1024*1024,
      vga_memory_size:8*1024*1024, screen_container:$('screen_container'),
      bios:{url:'vendor/seabios.bin'}, vga_bios:{url:'vendor/vgabios.bin'}, autostart:false,
    };
    if (local) { options[$('kind').value] = {buffer:await file.arrayBuffer()}; }
    else { options.cdrom = {url:'images/linux.iso'}; }
    const machine = new V86(options); vm = machine;
    machine.keyboard_set_enabled(false); machine.mouse_set_enabled(false);
    $('machine-name').textContent = local ? file.name : 'Linux demo / x86';
    $('empty').hidden = true; $('screen_container').hidden = false;
    render('loading','Loading firmware and boot image…');
    machine.add_listener('download-progress', e => {
      if (vm !== machine) return;
      $('message').textContent = e.total ? `Loading ${Math.min(100,Math.round(e.loaded/e.total*100))}% · file ${e.file_index+1}/${e.file_count}` : 'Loading machine files…';
    });
    machine.add_listener('download-error', e => {
      if (vm !== machine) return;
      const fileName = (e.file_name || 'machine file').split('/').pop();
      const status = e.request?.status;
      const reason = status ? `HTTP ${status}` : 'network request failed';
      void fail(new Error(`Could not load ${fileName} (${reason}). Make sure the images and vendor folders are uploaded beside index.html, then reload.`));
    });
    machine.add_listener('emulator-ready', () => { if (vm === machine) machine.run().catch(fail); });
    machine.add_listener('emulator-started', () => { if (vm === machine) render('running','Machine running · click the display to type'); });
    machine.add_listener('emulator-stopped', () => { if (vm === machine) render('paused','Machine paused'); });
  } catch (error) { await fail(error); }
};
$('pause').onclick = async () => {
  if (!vm) return;
  try { if (state === 'paused') await vm.run(); else await vm.stop(); } catch (error) { await fail(error); }
};
function confirmAction(action) {
  pendingAction = action;
  $('confirm-title').textContent = action === 'restart' ? 'Restart machine?' : 'Power off machine?';
  $('confirm').querySelector('p').textContent = action === 'restart' ? 'Unsaved work will be lost. The current disk stays attached.' : 'Unsaved work and changes to the disk will be lost.';
  $('accept').textContent = action === 'restart' ? 'Restart' : 'Power off';
  $('confirm').showModal();
}
$('restart').onclick = () => confirmAction('restart');
$('end').onclick = () => confirmAction('end');
$('cancel').onclick = () => $('confirm').close();
$('accept').onclick = async () => {
  $('confirm').close();
  try {
    if (pendingAction === 'restart' && vm) { vm.restart(); if (state === 'paused') await vm.run(); }
    else { await dispose(); render('idle','Machine powered off'); }
  } catch (error) { await fail(error); }
};
$('fullscreen').onclick = async () => { try { await $('display').requestFullscreen(); $('display').focus(); } catch (_) { $('message').textContent = 'Fullscreen is unavailable in this browser.'; } };
$('cad').onclick = () => vm?.keyboard_send_scancodes([0x1D,0x38,0x53,0xD3,0xB8,0x9D]);
$('display').onpointerdown = async event => {
  const display = $('display');
  display.focus();
  if (!vm || state !== 'running' || event.button !== 0 ||
      event.pointerType === 'touch' || document.pointerLockElement === display) return;
  vm.keyboard_set_enabled(true);
  vm.mouse_set_enabled(true);
  try {
    // Lock the display itself so the target is inside the fullscreen element.
    await display.requestPointerLock();
  } catch (_) {
    $('message').textContent = 'Mouse lock was unavailable. Click the display to try again.';
  }
};
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === $('display')) {
    $('message').textContent = 'Mouse locked · press Esc to release';
  } else if (state === 'running') {
    $('message').textContent = 'Mouse released · click the display to lock again';
  }
});
document.addEventListener('pointerlockerror', () => {
  $('message').textContent = 'Mouse lock was unavailable. Click the display to try again.';
});
document.addEventListener('focusin', () => { const active = document.activeElement === $('display'); vm?.keyboard_set_enabled(active); vm?.mouse_set_enabled(active); });
window.addEventListener('blur', () => { vm?.keyboard_set_enabled(false); vm?.mouse_set_enabled(false); });
window.addEventListener('beforeunload', e => { if (vm) { e.preventDefault(); e.returnValue = ''; } });

from pathlib import Path
from playwright.sync_api import sync_playwright
import json
p=Path(__file__).resolve().parent.parent
(p/'test-results').mkdir(exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel="chromium")
 page=browser.new_page(viewport={'width':1440,'height':1040},accept_downloads=True)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((p/'index.html').as_uri(),wait_until='load')
 page.wait_for_function('document.querySelector("#output").readyState >= 2')
 page.screenshot(path=str(p/'test-results/desktop.png'),full_page=True)
 assert page.locator('#thumb0').evaluate('(v)=>v.readyState')>=2
 assert page.locator('#thumb1').evaluate('(v)=>v.readyState')>=2
 page.locator('#sourceView').click()
 assert page.locator('#original').is_visible()
 page.locator('#effectView').click()
 with page.expect_download() as dl:page.locator('#download').click()
 dl.value.save_as(p/'test-results/demo.mp4')
 for preset in ['melt','bloom','rupture','auto']:
  previous=page.locator('#output').get_attribute('src')
  if preset=='auto':page.locator('#auto').click()
  else:
   page.locator(f'[data-preset="{preset}"]').click()
   page.locator('#render').click()
  page.wait_for_function('!document.querySelector("#processing").hidden',timeout=10000)
  page.wait_for_function('document.querySelector("#processing").hidden',timeout=180000)
  msg=page.locator('#notice').inner_text()
  print(preset,msg,flush=True)
  assert page.locator('#output').get_attribute('src')!=previous,msg
  page.wait_for_function('document.querySelector("#output").readyState >= 2')
  assert page.locator('#output').evaluate('(v)=>v.duration')>1
  with page.expect_download() as dl:page.locator('#download').click()
  dl.value.save_as(p/f'test-results/{preset}.mp4')
  with page.expect_download() as dl:page.locator('#downloadAvi').click()
  dl.value.save_as(p/f'test-results/{preset}.avi')
 page.locator('#render').click();page.locator('#cancel').click()
 assert 'Cancelled' in page.locator('#notice').inner_text()
 page.locator('#reset').click()
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(p/'test-results/mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: file:// demos, presets, real codec export, downloads, cancellation, responsive layout',flush=True)
 browser.close()


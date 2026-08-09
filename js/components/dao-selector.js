/**
 * DAO Selector Component
 * Province → District → DAO cascading selector with clean UI.
 */

import { t, getLang } from '../i18n.js';

let daoData = [];

export async function init() {
  try {
    const res = await fetch('data/dao.json');
    if (res.ok) daoData = await res.json();
  } catch { /* silent */ }
}

export function getProvinces() {
  return [...new Set(daoData.map(d => d.province))].sort();
}

export function getDistricts(province) {
  return daoData.filter(d => d.province === province).map(d => d.district).sort();
}

export function getDAO(district) {
  return daoData.find(d => d.district === district);
}

export function renderDAOSelector() {
  const lang = getLang();
  const provinces = getProvinces();

  return `
    <div style="background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:var(--radius-lg);padding:var(--space-5)">
      <h3 style="font-size:var(--text-lg);font-weight:var(--weight-semibold);margin-bottom:var(--space-1);display:flex;align-items:center;gap:var(--space-2)">
        <span class="material-symbols-rounded" aria-hidden="true" style="font-size:24px;color:var(--color-primary)">location_on</span>
        ${lang === 'ne' ? 'आफ्नो जिल्ला प्रशासनिक कार्यालय खोज्नुहोस्' : 'Find Your District Administration Office'}
      </h3>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">${lang === 'ne' ? 'प्रदेश र जिल्ला छानेर आफ्नो DAO कार्यालयको विवरण हेर्नुहोस्।' : 'Select your province and district to find your DAO office details.'}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4)">
        <div>
          <label style="display:block;font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--text-secondary);margin-bottom:var(--space-1);text-transform:uppercase;letter-spacing:0.05em">${lang === 'ne' ? 'प्रदेश' : 'Province'}</label>
          <select id="dao-province" style="width:100%;padding:var(--space-3);border:2px solid var(--border-primary);border-radius:var(--radius-md);font-size:var(--text-sm);background:var(--bg-primary);color:var(--text-primary);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22%2394a3b8%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 12px center">
            <option value="">${lang === 'ne' ? 'छान्नुहोस्' : 'Select'}</option>
            ${provinces.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--text-secondary);margin-bottom:var(--space-1);text-transform:uppercase;letter-spacing:0.05em">${lang === 'ne' ? 'जिल्ला' : 'District'}</label>
          <select id="dao-district" disabled style="width:100%;padding:var(--space-3);border:2px solid var(--border-primary);border-radius:var(--radius-md);font-size:var(--text-sm);background:var(--bg-primary);color:var(--text-primary);cursor:pointer;opacity:0.5;appearance:none;background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22%2394a3b8%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 12px center">
            <option value="">${lang === 'ne' ? 'पहिले प्रदेश छान्नुहोस्' : 'Select province first'}</option>
          </select>
        </div>
      </div>

      <div id="dao-info"></div>
    </div>
  `;
}

function renderDAOInfoHTML(dao, lang) {
  const websiteUrl = dao.website || `https://dao${dao.district.toLowerCase().replace(/\s+/g, '')}.moha.gov.np/en`;
  const mapUrl = dao.mapUrl || `https://www.google.com/maps/search/DAO+${dao.district}+Nepal`;

  return `
    <div style="background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:var(--space-4)">
      <div style="display:flex;align-items:flex-start;gap:var(--space-3);margin-bottom:var(--space-3)">
        <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--color-primary-50);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-rounded" style="font-size:22px;color:var(--color-primary)">apartment</span>
        </div>
        <div>
          <h4 style="font-weight:var(--weight-semibold);margin-bottom:2px">${lang === 'ne' ? (dao.name.ne || dao.name.en) : dao.name.en}</h4>
          <p style="font-size:var(--text-sm);color:var(--text-secondary)">${dao.headquarters}, ${dao.province}</p>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);margin-bottom:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-tertiary)">schedule</span>
          <span style="color:var(--text-secondary)">${lang === 'ne' ? (dao.hours.ne || dao.hours.en) : dao.hours.en}</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-tertiary)">call</span>
          <a href="tel:${dao.phone}" style="color:var(--text-primary);text-decoration:none;font-weight:var(--weight-medium)">${dao.phone}</a>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-tertiary)">tips_and_updates</span>
          <span style="color:var(--text-secondary)">${lang === 'ne' ? (dao.bestTime.ne || dao.bestTime.en) : dao.bestTime.en}</span>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn--secondary btn--sm" style="flex:1;justify-content:center">
          <span class="material-symbols-rounded" style="font-size:16px">map</span> ${t('map')}
        </a>
        <a href="${websiteUrl}" target="_blank" rel="noopener" class="btn btn--primary btn--sm" style="flex:1;justify-content:center">
          <span class="material-symbols-rounded" style="font-size:16px">open_in_new</span> ${lang === 'ne' ? 'DAO वेबसाइट' : 'DAO Website'}
        </a>
      </div>
    </div>
  `;
}

export function bindDAOSelector() {
  const provinceSelect = document.getElementById('dao-province');
  const districtSelect = document.getElementById('dao-district');

  if (!provinceSelect || !districtSelect) return;

  provinceSelect.addEventListener('change', () => {
    const province = provinceSelect.value;
    const districts = province ? getDistricts(province) : [];

    districtSelect.innerHTML = `<option value="">${districts.length ? (getLang() === 'ne' ? 'जिल्ला छान्नुहोस्' : 'Select District') : ''}</option>` +
      districts.map(d => `<option value="${d}">${d}</option>`).join('');
    districtSelect.disabled = !province;
    districtSelect.style.opacity = province ? '1' : '0.5';

    const infoContainer = document.getElementById('dao-info');
    if (infoContainer) infoContainer.innerHTML = '';
  });

  districtSelect.addEventListener('change', () => {
    const district = districtSelect.value;
    const dao = district ? getDAO(district) : null;
    const infoContainer = document.getElementById('dao-info');
    if (!infoContainer) return;

    if (!dao) { infoContainer.innerHTML = ''; return; }

    infoContainer.innerHTML = renderDAOInfoHTML(dao, getLang());
  });
}

const { ResearchResult } = require('../models/Research');
const ApiError = require('../utils/ApiError');

const DISCLAIMER =
  'Информация носит справочный характер и не заменяет консультацию врача. Не используйте её для самодиагностики и самолечения.';

function isLabAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim());
}

function openAiTimeoutMs() {
  const n = Number(process.env.OPENAI_TIMEOUT_MS);
  if (Number.isFinite(n) && n >= 3000) return Math.min(n, 120000);
  return 55000;
}

function statusRu(s) {
  const m = { normal: 'норма', deviation: 'отклонение от нормы', severe: 'сильное отклонение' };
  return m[s] || s;
}

function buildSummaryFromResult(result) {
  const rt = result.researchTypeId;
  const name = rt?.name || 'Лабораторное исследование';
  const lines = [`Название анализа: ${name}`];
  const date = result.date ? new Date(result.date).toLocaleString('ru-RU') : '—';
  lines.push(`Дата: ${date}`);
  lines.push(`Врач: ${result.doctorName || '—'}`);

  if (result.studyNote) {
    lines.push(`Комментарий врача: ${result.studyNote}`);
  }
  if (result.overallStatus && result.overallStatus !== 'normal') {
    lines.push(`Общая оценка врача: ${statusRu(result.overallStatus)}`);
  }

  const gt = rt?.gridTemplate;
  if (gt && Array.isArray(result.gridResults) && result.gridResults.length > 0) {
    const rows = Number(gt.rows) || 0;
    const cols = Number(gt.cols) || 0;
    const rh = Array.isArray(gt.rowHeaders) ? gt.rowHeaders : [];
    const ch = Array.isArray(gt.colHeaders) ? gt.colHeaders : [];
    const colUnits = Array.isArray(gt.colUnits) ? gt.colUnits : [];
    lines.push('Показатели (таблица):');
    for (const cell of result.gridResults) {
      const r = Number(cell.row);
      const c = Number(cell.col);
      const rowName = r >= 0 && r < rows && rh[r] ? rh[r] : `Строка ${r + 1}`;
      const colName = c >= 0 && c < cols && ch[c] ? ch[c] : `Столбец ${c + 1}`;
      const unit = c >= 0 && c < colUnits.length && String(colUnits[c] || '').trim() ? String(colUnits[c]).trim() : '';
      const rawVal = cell.value !== '' && cell.value != null ? String(cell.value) : '—';
      const val = unit && rawVal !== '—' ? `${rawVal} ${unit}` : rawVal;
      const com = cell.comment ? `; комментарий: ${cell.comment}` : '';
      lines.push(`- ${rowName} / ${colName}: ${val}${com}; оценка: ${statusRu(cell.status || 'normal')}`);
    }
  }

  if (Array.isArray(result.results) && result.results.length > 0) {
    const tpl = Array.isArray(rt?.template) ? rt.template : [];
    lines.push('Показатели:');
    for (const r of result.results) {
      const fromTpl = tpl.find((x) => x && String(x.name) === String(r.fieldName));
      const u = (r.unit && String(r.unit).trim()) || (fromTpl?.unit && String(fromTpl.unit).trim()) || '';
      const val = r.value !== '' && r.value != null ? String(r.value) : '—';
      lines.push(u && val !== '—' ? `- ${r.fieldName}: ${val} ${u}` : `- ${r.fieldName}: ${val}`);
    }
  }

  if (Array.isArray(result.customResults) && result.customResults.length > 0) {
    for (const cr of result.customResults) {
      lines.push(`- ${cr.name}: ${cr.value} ${cr.unit || ''}`.trim());
    }
  }

  return lines.join('\n');
}

async function callOpenAiChat(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim();
  if (!apiKey) return null;

  const base = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = `${base}/chat/completions`;
  const timeoutMs = openAiTimeoutMs();

  const signal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(timeoutMs)
      : undefined;

  const baseLower = base.toLowerCase();
  const isOpenRouter = baseLower.includes('openrouter.ai');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
  if (isOpenRouter) {
    const referer =
      (process.env.OPENROUTER_HTTP_REFERER && String(process.env.OPENROUTER_HTTP_REFERER).trim()) ||
      (process.env.FRONTEND_URL && String(process.env.FRONTEND_URL).split(',')[0].trim()) ||
      '';
    if (referer) {
      headers['HTTP-Referer'] = referer.slice(0, 2048);
    }
    const title =
      (process.env.OPENROUTER_APP_TITLE && String(process.env.OPENROUTER_APP_TITLE).trim()) || 'Мед24';
    headers['X-Title'] = title.slice(0, 128);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }),
    signal
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let hint = '';
    if (
      res.status === 403 &&
      (errText.includes('unsupported_country') || errText.includes('country, region, or territory not supported'))
    ) {
      hint =
        ' | Регион: прямой API OpenAI из вашей страны недоступен. В .env укажите OpenRouter: OPENAI_API_BASE=https://openrouter.ai/api/v1 , ключ — с openrouter.ai, модель — например openai/gpt-4o-mini';
    }
    if (
      res.status === 402 ||
      errText.includes('Insufficient credits') ||
      errText.includes('never purchased credits')
    ) {
      hint +=
        ' | OpenRouter: пополните баланс (Settings → Credits / Billing) и убедитесь, что API-ключ создан в том же аккаунте: https://openrouter.ai/settings/credits';
    }
    const ApiError = require('../utils/ApiError');
    throw new ApiError(502, `ИИ (${res.status}): ${errText.slice(0, 280)}${hint}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  return typeof text === 'string' ? text.trim() : null;
}

function staticInsightLines(fallbackReason) {
  const head =
    fallbackReason === 'api_error'
      ? 'Сервис ИИ сейчас недоступен или вернул ошибку. Ниже — краткая справка без ИИ.'
      : fallbackReason === 'empty_response'
        ? 'ИИ не вернул текст ответа. Ниже — краткая справка без ИИ.'
        : 'ИИ-пояснение на сервере не включено (нет переменной OPENAI_API_KEY в окружении бэкенда). Ниже — краткая справка.';
  return [
    head,
    'Обычно лабораторные показатели оценивают работу органов и обмен веществ; «нормы» зависят от лаборатории, пола и возраста.',
    'Сравнивайте результаты с заключением врача в карте и задавайте вопросы на очном приёме.',
    DISCLAIMER
  ];
}

function getLabInsightConfig() {
  return {
    aiConfigured: isLabAiConfigured(),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    apiBaseHost: (() => {
      try {
        const b = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
        return new URL(b).host;
      } catch {
        return '—';
      }
    })()
  };
}

/**
 * Пояснение для пациента по сохранённому результату анализа (только свой patientId).
 */
async function generatePatientLabInsight(patientId, researchResultId) {
  if (!researchResultId || String(researchResultId).length < 10) {
    throw ApiError.badRequest('Укажите корректный идентификатор результата');
  }

  const result = await ResearchResult.findOne({
    _id: researchResultId,
    patientId
  })
    .populate('researchTypeId')
    .lean();

  if (!result) {
    throw ApiError.notFound('Результат не найден');
  }

  const summary = buildSummaryFromResult(result);

  const systemPrompt = `Ты помощник для пациентов. Объясни простым языком на русском, что могут означать перечисленные лабораторные данные в общем виде: на что обычно влияют такие показатели в жизни (питание, образ жизни), без постановки диагноза.
Правила:
- 5–10 коротких предложений или маркированный список.
- Не пугай без причины; не придумывай конкретных заболеваний по числам.
- В конце напомни обратиться к лечащему врачу за интерпретацией.
- Не противоречь явным пометкам врача в данных.`;

  const aiConfigured = isLabAiConfigured();
  let insight = null;
  let source = 'static';
  let fallbackReason = 'no_key';

  if (aiConfigured) {
    fallbackReason = null;
    try {
      const ai = await callOpenAiChat(systemPrompt, `Данные анализа для справки:\n\n${summary}\n\n${DISCLAIMER}`);
      if (ai) {
        insight = ai;
        source = 'ai';
        fallbackReason = null;
      } else {
        fallbackReason = 'empty_response';
      }
    } catch (e) {
      console.warn('lab-insight OpenAI:', e.message);
      fallbackReason = 'api_error';
    }
  }

  if (!insight) {
    insight = staticInsightLines(fallbackReason).join('\n\n');
    source = 'static';
  }

  return {
    insight,
    source,
    disclaimer: DISCLAIMER,
    aiConfigured,
    fallbackReason: source === 'ai' ? null : fallbackReason
  };
}

module.exports = {
  generatePatientLabInsight,
  buildSummaryFromResult,
  isLabAiConfigured,
  getLabInsightConfig
};

/**
 * Типовые бланки лабораторных исследований (сетка: строки = показатели, столбцы = колонки ввода).
 * Ищите по коротким запросам: «оак», «биохимия», «оам», «липид», «коагул», «ттг».
 * createdBy: null — системные шаблоны, доступны всем врачам.
 */

const COL_RESULT = ['Результат'];

const OAK_ROWS = [
  'Гемоглобин',
  'Эритроциты',
  'Гематокрит',
  'Средний объём эритроцита (MCV)',
  'Среднее содержание Hb в эритроците (MCH)',
  'Средняя концентрация Hb в эритроците (MCHC)',
  'Тромбоциты',
  'Лейкоциты (общ.)',
  'Нейтрофилы (сегм. + палочк.)',
  'Лимфоциты',
  'Моноциты',
  'Эозинофилы',
  'Базофилы',
  'СОЭ (скорость оседания эритроцитов)'
];

const BIOCHEM_ROWS = [
  'Глюкоза',
  'Мочевина',
  'Креатинин',
  'Билирубин общий',
  'Билирубин прямой (конъюгированный)',
  'АЛТ (АлАТ)',
  'АСТ (АсАТ)',
  'Щелочная фосфатаза',
  'ГГТ (γ-ГТ)',
  'Общий белок',
  'Альбумин',
  'Холестерин общий',
  'Триглицериды',
  'Калий',
  'Натрий'
];

const LIPID_ROWS = [
  'Холестерин общий',
  'ЛПНП (ЛПОНП)',
  'ЛПВП',
  'Триглицериды',
  'Индекс атерогенности'
];

const OAM_ROWS = [
  'Цвет',
  'Прозрачность',
  'Относительная плотность (удельный вес)',
  'pH',
  'Белок',
  'Глюкоза',
  'Кетоновые тела',
  'Билирубин',
  'Нитриты',
  'Эритроциты (микроскопия)',
  'Лейкоциты (микроскопия)',
  'Слизь, соли, цилиндры (заключение)'
];

const COAG_ROWS = [
  'Протромбиновое время (ПВ), сек',
  'МНО / INR',
  'АЧТВ (АПТВ), сек',
  'Фибриноген, г/л',
  'Д-димер'
];

const THYROID_ROWS = ['ТТГ (тиреотропный гормон)', 'Т4 свободный', 'Т3 свободный', 'Антитела к ТПО (АТ-ТПО)'];

function grid(rowsList, colHeaders = COL_RESULT) {
  const rowHeaders = [...rowsList];
  const cols = colHeaders.length;
  return {
    rows: rowHeaders.length,
    cols,
    rowHeaders,
    colHeaders: [...colHeaders],
    cellDefaults: []
  };
}

const defaultLabGridTemplates = [
  {
    name: 'ОАК (общий анализ крови)',
    category: 'laboratory',
    templateMode: 'grid',
    template: [],
    gridTemplate: grid(OAK_ROWS)
  },
  {
    name: 'Биохимия крови (стандарт)',
    category: 'laboratory',
    templateMode: 'grid',
    template: [],
    gridTemplate: grid(BIOCHEM_ROWS)
  },
  {
    name: 'Липидограмма (липиды крови)',
    category: 'laboratory',
    templateMode: 'grid',
    template: [],
    gridTemplate: grid(LIPID_ROWS)
  },
  {
    name: 'ОАМ (общий анализ мочи)',
    category: 'laboratory',
    templateMode: 'grid',
    template: [],
    gridTemplate: grid(OAM_ROWS)
  },
  {
    name: 'Коагулограмма (гемостаз)',
    category: 'laboratory',
    templateMode: 'grid',
    template: [],
    gridTemplate: grid(COAG_ROWS)
  },
  {
    name: 'Щитовидная железа (базовые гормоны)',
    category: 'laboratory',
    templateMode: 'grid',
    template: [],
    gridTemplate: grid(THYROID_ROWS)
  }
];

module.exports = { defaultLabGridTemplates };

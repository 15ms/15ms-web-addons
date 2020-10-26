(function () {
  function getSQ(x) {
    return x * x;
  }

  var state = {
    model: [],
    stats: {}
  };

  function getTep(data, stat) {
    let item1 = 1;
    let item2 = data.length / Math.sqrt(3);
    let item3 = 0;
    for (let i = 1; i < data.length; i += 1) {
      for (let j = 0; j <= i - 1; j += 1) {
        item3 += Math.exp(- 0.5 * getSQ(data[j] - data[i]) / stat.stat_dev0)
      }
    }
    item3 = item3 * 2 / data.length;
    let item4 = 0;
    for (let i = 0; i < data.length; i ++) {
      item4 += Math.exp(- 0.25 * getSQ(data[i] - stat.stat_avg) / stat.stat_dev0);
    }
    item4 = item4 * Math.sqrt(2);
    console.log(item1, item2, item3, item4);
    return item1 + item2 + item3 - item4;
  }

  function getF(stat1, stat2) {
    if (stat1.stat_dev1 > stat2.stat_dev1) {
      return stat1.stat_dev1 / stat2.stat_dev1;
    }
    return stat2.stat_dev1 / stat1.stat_dev1;
  }

  // 总体-样本 参数假设检验，前者总体、后者样本

  // 方差检验
  function getXSQ(stat1, stat2) {
    return (stat2.stat_len - 1) * stat2.stat_dev0 / stat1.stat_dev0;
  }

  // 均值检验：已知单总体方差=样本方差
  function getU1(stat1, stat2) {
    return Math.sqrt(stat2.stat_len) * (stat2.stat_avg - stat1.stat_avg) / Math.sqrt(stat1.stat_dev0);
  }

  // 均值检验：未知总体方差
  function getT1(stat1, stat2) {
    return Math.sqrt(stat2.stat_len) * (stat2.stat_avg - stat1.stat_avg) / Math.sqrt(stat2.stat_dev0);
  }

  // 均值检验自由度：未知总体方差
  function getT1DF(stat1, stat2) {
    return stat2.stat_len - 1;
  }

  // 总体-总体 参数假设检验

  // 均值检验：已知两总体方差
  function getU2(stat1, stat2) {
    return (stat1.stat_avg - stat2.stat_avg) / Math.sqrt(stat1.stat_dev0 / stat1.stat_len + stat2.stat_dev0 / stat2.stat_len);
  }

  // 均值检验：已知总体方差相等、值未知
  function getT2(stat1, stat2) {
    const sw = (stat1.stat_sum_sq + stat2.stat_sum_sq) / getT2DF(stat1, stat2);
    return (stat1.stat_avg - stat2.stat_avg) / (Math.sqrt(1 / stat1.stat_len + 1 / stat2.stat_len) * sw);
  }

  // 均值检验自由度：已知总体方差相等、值未知
  function getT2DF(stat1, stat2) {
    return stat1.stat_len + stat2.stat_len - 2;
  }

  // 均值检验自由度：未知总体方差
  // 前者总体、后者样本
  function getT2DF(stat1, stat2) {
    return stat2.stat_len - 1;
  }

  function parseInput(text) {
    const tokens = text.split(/[^\d+\.\-e]/).filter(Boolean);
    const values = tokens.map(e => Number(e));
    const valids = values.filter(e => !Number.isNaN(e));
    console.log(tokens, values, valids);
    return {
      data: valids,
      stat: { size_raw: tokens.length, size_num: valids.length }
    };
  }

  function runBasicStat(group) {
    const v_len = group.data.length;
    const v_sum = group.data.reduce((sum, a) => sum + a, 0);
    const v_avg = v_sum / v_len;
    const v_sum_sq = group.data.reduce((sum, a) => sum + getSQ(a - v_avg), 0);
    const v_dev0 = v_sum_sq / v_len;
    const v_dev1 = v_sum_sq / (v_len - 1);
    group.stat.stat_sum_sq = v_sum_sq;
    group.stat.stat_len = v_len;
    group.stat.stat_sum = v_sum;
    group.stat.stat_avg = v_avg;
    group.stat.stat_dev0 = v_dev0;
    group.stat.stat_dev1 = v_dev1;
  }

  function runDistrTest(group) {
    const v_ep = getTep(group.data, group.stat);
    group.stat.stat_ep = v_ep;
  }

  function runPairsTest(group1, group2) {
    if (!group1 || !group2) return;
    const v_f = getF(group1.stat, group2.stat);
    const v_xsq = getXSQ(group1.stat, group2.stat);
    const v_u1 = getU1(group1.stat, group2.stat);
    const v_u2 = getU2(group1.stat, group2.stat);
    const v_t1 = getT1(group1.stat, group2.stat);
    const v_t1df = getT1DF(group1.stat, group2.stat);
    const v_t2 = getT2(group1.stat, group2.stat);
    const v_t2df = getT2DF(group1.stat, group2.stat);
    const stats = state.stats;
    stats.stat_f = v_f;
    stats.stat_xsq = v_xsq;
    stats.stat_u1 = v_u1;
    stats.stat_u2 = v_u2;
    stats.stat_t1 = v_t1;
    stats.stat_t1df = v_t1df;
    stats.stat_t2 = v_t2;
    stats.stat_t2df = v_t2df;
  }

  function shortFixed(value, length) {
    const text = value.toString().split('.')[1];
    if (text && text.length > length) {
      return value.toFixed(length);
    }
    return value;
  }
  
  function renderGroup(group) {
    var innerHTML = '<div>';
    innerHTML += ('<p>输入数据 ${1} 项，解析为数值 ${2} 项</p>'
      .replace('${1}', group.stat.size_raw)
      .replace('${2}', group.stat.size_num)
    );
    innerHTML += ('<p>求和 ${1}，平均 ${2}，方差 ${3}，无偏方差 ${4}</p>'
      .replace('${1}', group.stat.stat_sum)
      .replace('${2}', shortFixed(group.stat.stat_avg, 4))
      .replace('${3}', shortFixed(group.stat.stat_dev0, 4))
      .replace('${4}', shortFixed(group.stat.stat_dev1, 4))
    );
    innerHTML += ('<p>EP检测量 ${1}</p>'
      .replace('${1}', shortFixed(group.stat.stat_ep, 4))
    );
    innerHTML += '</div>';
    return innerHTML;
  }

  function renderStats(stats) {
    var innerHTML = '<div>';
    innerHTML += '<p>假如两集合都是正态总体的样本</p>';
    if (stats.stat_f) {
      innerHTML += ('<p>方差检验 F=${1}</p>'
        .replace('${1}', shortFixed(stats.stat_f, 4))
      );
    }
    if (stats.stat_u2) {
      innerHTML += ('<p>均值检验 u=${1}，设定已知总体方差或样本大</p>'
        .replace('${1}', shortFixed(stats.stat_u2, 4))
      );
    }
    if (stats.stat_t2 && stats.stat_t2df) {
      innerHTML += ('<p>均值检验 t=${1}、自由度=${2}，设定已知总体方差相等未知值</p>'
        .replace('${1}', shortFixed(stats.stat_t2, 4))
        .replace('${2}', shortFixed(stats.stat_t2df, 4))
      );
    }
    innerHTML += '</div><div>';
    innerHTML += '<p>假如集合一是正态总体、集合二是来自总体的样本</p>';
    if (stats.stat_xsq) {
      innerHTML += ('<p>方差检验 卡方=${1}</p>'
        .replace('${1}', shortFixed(stats.stat_xsq, 4))
      );
    }
    if (stats.stat_u1) {
      innerHTML += ('<p>均值检验 u=${1}，设定总体与样本方差相等</p>'
        .replace('${1}', shortFixed(stats.stat_u1, 4))
      );
    }
    if (stats.stat_t1 && stats.stat_t1df) {
      innerHTML += ('<p>均值检验 t=${1}、自由度=${2}，设定总体方差未知</p>'
        .replace('${1}', shortFixed(stats.stat_t1, 4))
        .replace('${2}', stats.stat_t1df)
      );
    }
    innerHTML += '</div>';
    return innerHTML;
  }

  function performRender() {
    var model = state.model;
    var element = document.getElementById('output');
    var innerHTML = '';
    model.forEach(group => {
      innerHTML += renderGroup(group);
    });
    innerHTML += renderStats(state.stats);
    element.innerHTML = innerHTML;
  }

  function handleChange(value, index) {
    const group = parseInput(value);
    state.model[index] = group;
    runBasicStat(group);
    runDistrTest(group);
    runPairsTest(state.model[0], state.model[1]);
    performRender();
  }

  document.getElementById('data1').addEventListener('input', (e) => {
    handleChange(e.target.value, 0);
  });
  document.getElementById('data2').addEventListener('input', (e) => {
    handleChange(e.target.value, 1);
  });
}());

let scores = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0, T7: 0, T8: 0, T9: 0 };
let actionLog = { neutralCount: 0, boxAction: "", mirrorAction: "", doorAction: "", riskKey: "", escapeAttempt: 0, bugSquish: 0, textAnalysis: "" };
let selfTypeInput = "";

let currentQuestions = [];
let currentIndex = 0;
let historyState = [];
let escapeClicks = 0;
let squishCount = 0;

// 計算結果の一時キャッシュ領域
let computedData = null;

const headTypes = ['T5','T6','T7'];
const heartTypes = ['T2','T3','T4'];
const gutTypes = ['T8','T9','T1'];

function showModal(text, callback = null) {
    document.getElementById('modal-text').innerText = text;
    document.getElementById('custom-modal').classList.remove('hidden');
    document.getElementById('modal-close-btn').onclick = () => {
        document.getElementById('custom-modal').classList.add('hidden');
        if (callback) callback();
    };
}

window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('lock-screen').classList.add('active');
    }, 1500);
});

document.getElementById('key-slider').addEventListener('input', (e) => {
    if (e.target.value > 75 && e.target.value < 90) {
        document.getElementById('lock-icon').className = "fa-solid fa-lock-open";
        document.getElementById('lock-icon').style.color = "var(--gold)";
        document.getElementById('lock-message').classList.remove('hidden');
        document.getElementById('start-btn').classList.remove('hidden');
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    selfTypeInput = document.getElementById('user-type').value || "未入力";
    currentQuestions = [...mainQuestions];

    const shuffledChecks = checkboxQuestions.sort(() => Math.random() - 0.5);
    const container = document.getElementById('checkbox-container');
    container.innerHTML = "";
    shuffledChecks.forEach((q) => {
        container.innerHTML += `<label><input type="checkbox" value="${q.type}"> ${q.text}</label><br>`;
    });

    document.getElementById('lock-screen').classList.remove('active');
    document.getElementById('checkbox-screen').classList.add('active');
});

document.getElementById('checkbox-next-btn').addEventListener('click', () => {
    document.querySelectorAll('#checkbox-container input:checked').forEach(chk => {
        scores[chk.value] += 2;
    });
    document.getElementById('checkbox-screen').classList.remove('active');
    document.getElementById('quiz-screen').classList.add('active');
    showNextQuestion();
});

function saveState() {
    historyState.push({ scores: JSON.parse(JSON.stringify(scores)), actionLog: JSON.parse(JSON.stringify(actionLog)), escapeClicks: escapeClicks });
}

document.getElementById('back-btn').addEventListener('click', () => {
    if (historyState.length > 0) {
        currentIndex--;
        const last = historyState.pop();
        scores = last.scores; actionLog = last.actionLog; escapeClicks = last.escapeClicks;
        showNextQuestion();
    }
});

function showNextQuestion() {
    if (currentIndex >= currentQuestions.length) {
        startResultLoading();
        return;
    }

    const q = currentQuestions[currentIndex];
    const total = currentQuestions.length;
    document.getElementById('progress').style.width = `${((currentIndex) / total) * 100}%`;
    document.getElementById('progress-text').innerText = `深層ログ観測 ${currentIndex + 1} / ${total}`;
    document.getElementById('question-text').innerText = q.text;
    
    document.getElementById('options-container').classList.add('hidden');
    document.getElementById('gimmick-container').classList.add('hidden');
    document.getElementById('text-input-container').classList.add('hidden');
    document.getElementById('escape-container').classList.add('hidden');
    document.getElementById('back-btn').style.display = currentIndex > 0 ? "inline-block" : "none";

    document.getElementById('darling-speech').innerText = "矛盾してるからこそ、暴くのが面白いのよ♡";

    if (q.type === "standard") {
        document.getElementById('options-container').classList.remove('hidden');
        const newOptions = document.getElementById('options-container').cloneNode(true);
        document.getElementById('options-container').replaceWith(newOptions);
        newOptions.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                saveState();
                const val = parseInt(btn.getAttribute('data-val'));
                if (val === 3) actionLog.neutralCount++;
                currentIndex++; showNextQuestion();
            });
        });
    } else if (q.type === "text") {
        document.getElementById('text-input-container').classList.remove('hidden');
        document.getElementById('submit-text-btn').onclick = () => {
            saveState();
            const text = document.getElementById('secret-textarea').value;
            analyzeSecretText(text);
            currentIndex++; showNextQuestion();
        };
    } else if (q.type === "gimmick") {
        handleGimmick(q);
    }
}

function analyzeSecretText(text) {
    let logMsg = [];
    let scoreApplied = [];

    if (text.length === 0) {
        scores.T5 += 3; scores.T9 += 3;
        logMsg.push("無言・未記入（T5/T9的防衛）");
    } else {
        if (text.length < 10) { scores.T5 += 2; logMsg.push("短文（T5的隠蔽）"); }
        else if (text.length > 50) { scores.T4 += 2; scores.T1 += 2; logMsg.push("長文（T4/T1的自己主張）"); }

        const kanjiCount = (text.match(/[一-龥]/g) || []).length;
        const hiraganaCount = (text.match(/[あ-ん]/g) || []).length;
        if (kanjiCount > text.length * 0.4) { scores.T1 += 2; scores.T5 += 2; logMsg.push("高漢字率（T1/T5的論理武装）"); }
        if (hiraganaCount > text.length * 0.6) { scores.T2 += 2; scores.T9 += 2; logMsg.push("高ひらがな率（T2/T9的親和・回避）"); }

        const keywordMap = {
            T1: ["正しい", "完璧", "ミス", "間違い", "ルール", "べき"],
            T2: ["助け", "愛", "感謝", "誰かのため", "寂しい"],
            T3: ["成功", "実績", "成果", "負け", "目標", "ステータス"],
            T4: ["孤独", "特別", "個性", "理解", "悲しい", "自分だけ"],
            T5: ["知る", "理解", "分析", "プライベート", "隠す", "調べる"],
            T6: ["不安", "安全", "怖い", "心配", "裏切り", "頼る"],
            T7: ["楽しい", "飽きる", "自由", "刺激", "退屈", "わくわく"],
            T8: ["支配", "コントロール", "弱い", "負ける", "怒り", "戦う"],
            T9: ["平和", "合わせる", "穏やか", "対立", "どうでもいい", "めんどくさい"]
        };

        for (const [type, words] of Object.entries(keywordMap)) {
            if (words.some(word => text.includes(word))) {
                scores[type] += 3;
                scoreApplied.push(type);
            }
        }
        if (scoreApplied.length > 0) logMsg.push(`単語検知: [${scoreApplied.join(", ")}]`);
    }
    actionLog.textAnalysis = logMsg.join(" / ") || "通常入力";
}

function handleGimmick(q) {
    document.getElementById('gimmick-container').classList.remove('hidden');
    const choiceBox = document.getElementById('gimmick-choices-container');
    choiceBox.innerHTML = "";
    
    if (q.gimmickType === "box") {
        q.choices.forEach((c, i) => {
            let btn = document.createElement('button'); btn.className = "btn"; btn.innerText = c;
            btn.onclick = () => {
                saveState();
                if (i === 0) { 
                    actionLog.boxAction = "開けた(空だった)"; scores.T7+=3; scores.T8+=2; 
                    showModal("【システム通知：箱の中身は『空』でした。】\nあら、無価値なものに期待して失態を演じたわね。早く言い訳を構築して？♡", () => { currentIndex++; showNextQuestion(); });
                } else { 
                    actionLog.boxAction = "無視した"; scores.T5+=3; scores.T6+=2; 
                    showModal("【システム通知：箱は消滅しました。】\n得る機会すら自ら放棄する。それがあなたの影の防衛よ♡", () => { currentIndex++; showNextQuestion(); });
                }
            }; choiceBox.appendChild(btn);
        });
    } else if (q.gimmickType === "mirror") {
        let startTime = Date.now();
        q.choices.forEach((c, i) => {
            let btn = document.createElement('button'); btn.className = "btn"; btn.innerText = c;
            btn.style.display = "block"; btn.style.width = "100%"; btn.style.fontSize = "0.8rem";
            btn.onclick = () => {
                saveState();
                let timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
                let tType = i===0 ? "恥" : i===1 ? "恐怖" : "怒り";
                actionLog.mirrorAction = `${tType}を選択 (${timeTaken}秒迷った)`;
                
                if(i===0){ scores.T2+=3; scores.T3+=3; scores.T4+=3; }
                if(i===1){ scores.T5+=3; scores.T6+=3; scores.T7+=3; }
                if(i===2){ scores.T8+=3; scores.T9+=3; scores.T1+=3; }
                showModal(`あなたのその過剰反応（${timeTaken}秒の迷い）、しっかり抽出したわ♡`, () => { currentIndex++; showNextQuestion(); });
            }; choiceBox.appendChild(btn);
        });
    } else if (q.gimmickType === "doors") {
        q.choices.forEach((c, i) => {
            let btn = document.createElement('button'); btn.className = "btn"; btn.innerText = c;
            btn.style.display = "block"; btn.style.width = "100%"; btn.style.fontSize = "0.9rem";
            btn.onclick = () => {
                saveState();
                if(i===0){ 
                    actionLog.doorAction = "扉A：分かって見られる"; scores.T3+=3; scores.T5+=3; scores.T7+=3; scores.T2+=3;
                    showModal("他人の目よりも、『知る事』や『見られる事』への欲求が勝ったのね♡", () => { currentIndex++; showNextQuestion(); });
                } else {
                    actionLog.doorAction = "扉B：見られないが不透明"; scores.T6+=3; scores.T9+=3; scores.T1+=3; scores.T4+=3;
                    showModal("傷つかない安全圏を選んだのね。でも永遠に真実は分からないわよ♡", () => { currentIndex++; showNextQuestion(); });
                }
            }; choiceBox.appendChild(btn);
        });
    } else if (q.gimmickType === "riskKey") {
        q.choices.forEach((c, i) => {
            let btn = document.createElement('button'); btn.className = "btn"; btn.innerText = c;
            btn.onclick = () => {
                saveState();
                if (i === 0) {
                    const sec = "強がっているが実は傷つくのを極端に恐れている";
                    actionLog.riskKey = `回した(暴かれたログ: ${sec})`; scores.T8+=3; scores.T3+=2;
                    showModal(`【隠蔽ログ抽出: ${sec}】\nあら、見ちゃいけないバグが漏れたわね♡ ポイント+20よ。`, () => { currentIndex++; showNextQuestion(); });
                } else {
                    actionLog.riskKey = "回さなかった"; scores.T6+=3;
                    currentIndex++; showNextQuestion();
                }
            }; choiceBox.appendChild(btn);
        });
    } else if (q.gimmickType === "escape") {
        document.getElementById('escape-container').classList.remove('hidden');
        let btn = document.createElement('button'); btn.className = "btn"; btn.innerText = "観測を続ける";
        btn.onclick = () => { saveState(); currentIndex++; showNextQuestion(); };
        choiceBox.appendChild(btn);

        document.getElementById('escape-btn').onclick = () => {
            escapeClicks++;
            if (escapeClicks >= 3) {
                document.getElementById('quiz-screen').classList.remove('active');
                document.getElementById('badend-screen').classList.add('active');
            }
        };
    }
}

// 芋虫
document.getElementById('caterpillar').addEventListener('click', () => {
    actionLog.bugSquish++;
    squishCount++;
    const speech = document.querySelector('.bug-speech');
    const caterpillarObj = document.getElementById('caterpillar');
    
    // スケール変更で徐々に縮小する演出
    caterpillarObj.style.transform = `scale(${1 - (squishCount * 0.03)})`;

    if (squishCount >= 30) {
        // 完全に潰した瞬間に撃破ボーナスでドカンと加点！
        scores.T8 += 8; 
        
        speech.innerText = "ギャアアア！";
        speech.classList.remove('hidden');
        caterpillarObj.querySelector('.bug-icon').innerText = '💥';
        setTimeout(() => { caterpillarObj.style.display = 'none'; }, 1000);
    } else {
        // 通常タップは5回に1回だけ「1」加点（12回タップで「2」しか増えません）
        if (squishCount % 5 === 0) {
            scores.T8 += 1;
        }
        
        const localBugSpeeches = ["SLEか？やめろ！", "…構造が崩れる。", "無意味な干渉だ。", "…T8ログを加算。", "破壊衝動か。"];
        speech.innerText = localBugSpeeches[Math.floor(Math.random() * localBugSpeeches.length)];
        speech.classList.remove('hidden');
        setTimeout(() => { speech.classList.add('hidden'); }, 1500);
    }
});
// 【バグ防止】すべての計算をこの一箇所だけで処理し、キャッシュする
function compileResults() {
    const allSorted = Object.keys(scores).sort((a,b) => scores[b] - scores[a]);
    const baseType = allSorted[0];
    const bNum = parseInt(baseType[1]);
    
    const w1 = bNum === 1 ? 9 : bNum - 1;
    const w2 = bNum === 9 ? 1 : bNum + 1;
    const calcWing = scores["T"+w1] > scores["T"+w2] ? "T"+w1 : "T"+w2;

    const headTypes = ['T5','T6','T7'];
    const heartTypes = ['T2','T3','T4'];
    const gutTypes = ['T8','T9','T1'];

    // 【重要バグ修正】トライタイプの1番目は強制的にベースタイプにする！
    let tri1 = baseType;
    let tri2, triLast;
    
    if (headTypes.includes(baseType)) {
        const heartMax = [...heartTypes].sort((a,b)=>scores[b]-scores[a])[0];
        const gutMax = [...gutTypes].sort((a,b)=>scores[b]-scores[a])[0];
        const sub = [heartMax, gutMax].sort((a,b)=>scores[b]-scores[a]);
        tri2 = sub[0]; triLast = sub[1];
    } else if (heartTypes.includes(baseType)) {
        const headMax = [...headTypes].sort((a,b)=>scores[b]-scores[a])[0];
        const gutMax = [...gutTypes].sort((a,b)=>scores[b]-scores[a])[0];
        const sub = [headMax, gutMax].sort((a,b)=>scores[b]-scores[a]);
        tri2 = sub[0]; triLast = sub[1];
    } else {
        const headMax = [...headTypes].sort((a,b)=>scores[b]-scores[a])[0];
        const heartMax = [...heartTypes].sort((a,b)=>scores[b]-scores[a])[0];
        const sub = [headMax, heartMax].sort((a,b)=>scores[b]-scores[a]);
        tri2 = sub[0]; triLast = sub[1];
    }
    
    const calcTriStr = "△" + tri1[1] + tri2[1] + triLast[1];

    computedData = {
        baseType,
        calcWing,
        calcTriStr,
        tri2,
        triLast
    };
}

// GAS送信関数
function sendDataToGAS(calculatedType, strength) {
    const gasURL = "https://script.google.com/macros/s/AKfycbxv5kGEPjHsR1sCcEyJkykbPtzz8TOGtfK6Put0WnnQkUfj_Mr7bhykXNnb0WlPcrmw/exec";
    const secretText = document.getElementById('secret-textarea').value || "（未記入）";
    const data = {
        email: "momoka.mimika1122@gmail.com",
        selfType: selfTypeInput,
        calcType: calculatedType,
        strength: strength,
        secretText: secretText,
        neutralCount: actionLog.neutralCount,
        boxAction: actionLog.boxAction,
        mirrorAction: actionLog.mirrorAction,
        doorAction: actionLog.doorAction,
        riskKey: actionLog.riskKey,
        bugSquish: actionLog.bugSquish
    };

    fetch(gasURL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(err => console.error("GAS送信エラー:", err));
}

function startResultLoading() {
    document.getElementById('quiz-screen').classList.remove('active');
    document.getElementById('result-loading-screen').classList.add('active');
    
    // 1. スコアデータを1回だけ完全に計算・コンパイル
    compileResults();

    const subTypes = [
        { role: "ウィング", type: computedData.calcWing, score: scores[computedData.calcWing] },
        { role: "トライ2", type: computedData.tri2, score: scores[computedData.tri2] },
        { role: "トライ3", type: computedData.triLast, score: scores[computedData.triLast] }
    ];
    subTypes.sort((a, b) => b.score - a.score);
    const orderPattern = `${subTypes[0].role}_${subTypes[1].role}_${subTypes[2].role}`;

    let strengthTitle = "";
    if (computedData.calcWing === computedData.tri2 || computedData.calcWing === computedData.triLast) {
        strengthTitle = "【ひみつ強度：特異点】過剰濃縮のダブルフィックス";
    } else {
        if(orderPattern === "ウィング_トライ2_トライ3") strengthTitle = "【ひみつ強度：高】絶対防衛のねじれ";
        else if(orderPattern === "トライ2_ウィング_トライ3") strengthTitle = "【ひみつ強度：極高】過剰武装のねじれ";
        else if(orderPattern === "トライ2_トライ3_ウィング") strengthTitle = "【ひみつ強度：警戒】防衛崩壊のねじれ";
        else strengthTitle = "【ひみつ強度：システムエラー】無防備な渇望";
    }

    // 2. ローディング中に、計算結果と行動データをGASに裏送信する！
    sendDataToGAS(`${computedData.baseType}w${computedData.calcWing[1]} / ${computedData.calcTriStr}`, strengthTitle);

    setTimeout(() => {
        document.getElementById('result-loading-screen').classList.remove('active');
        showResult();
    }, 2500);
}

// 結果表示
function showResult() {
    document.getElementById('result-screen').classList.add('active');
    document.body.className = "room-stage-4";
    document.getElementById('result-speech').innerText = darlingFinalSpeech;
    
    document.getElementById('result-user-type').innerText = selfTypeInput;
    document.getElementById('result-calculated-type').innerText = `${computedData.baseType}w${computedData.calcWing[1]} / ${computedData.calcTriStr}`;

    const subTypes = [
        { role: "ウィング", type: computedData.calcWing, score: scores[computedData.calcWing] },
        { role: "トライ2", type: computedData.tri2, score: scores[computedData.tri2] },
        { role: "トライ3", type: computedData.triLast, score: scores[computedData.triLast] }
    ];
    subTypes.sort((a, b) => b.score - a.score);

    const orderPattern = `${subTypes[0].role}_${subTypes[1].role}_${subTypes[2].role}`;
    const orderNumbers = `${subTypes[0].type.replace('T','')} ＞ ${subTypes[1].type.replace('T','')} ＞ ${subTypes[2].type.replace('T','')}`;

    let strengthTitle = "";
    let strengthDesc = "";

    const typeNames = { T1: "正しさ", T2: "愛と必要性", T3: "成果と称賛", T4: "唯一無二の個性", T5: "自己完結と傍観", T6: "確かな指針と安全", T7: "刺激と自由", T8: "強さと支配", T9: "平穏と調和" };
    const t0Name = typeNames[subTypes[0].type];
    const t1Name = typeNames[subTypes[1].type];
    const t2Name = typeNames[subTypes[2].type];

    // 【激レアギミック】ウィングとトライタイプが被った場合（ダブルフィックス）
    if (computedData.calcWing === computedData.tri2 || computedData.calcWing === computedData.triLast) {
        const doubleTypeName = typeNames[computedData.calcWing];
        strengthTitle = "【ひみつ強度：特異点】過剰濃縮のダブルフィックス";
        strengthDesc = `防衛線（ウィング）と最深欲求（トライタイプ）が「${doubleTypeName}」という同一の要素で完全に被っています。逃げるための防衛と、求めるための欲求が同じ場所に向かっている、逃げ場のない極度に濃縮された特異な構造です。`;
    } else {
        switch(orderPattern) {
            case "ウィング_トライ2_トライ3":
                strengthTitle = "【ひみつ強度：高】絶対防衛のねじれ";
                strengthDesc = `日常的な防衛ラインである「${t0Name}」が最も分厚く機能しており、外界を強く警戒しています。「${t1Name}」をサブ武器としつつ、最深部の本当の欲求である「${t2Name}」はシステム深部に完全に隠蔽されている、極めて強固で防衛的な構造です。`;
                break;
            case "トライ2_ウィング_トライ3":
                strengthTitle = "【ひみつ強度：極高】過剰武装のねじれ";
                strengthDesc = `サブの自我として「${t0Name}」を武器のように振りかざし、マイルールで世界に対抗しています。本来の防衛（${t1Name}）すら凌駕する武装により、最深部の本当の弱点である「${t2Name}」には誰も触れることができません。`;
                break;
            case "トライ2_トライ3_ウィング":
                strengthTitle = "【ひみつ強度：警戒】防衛崩壊のねじれ";
                strengthDesc = `「${t2Name}」による防衛ラインが後手に回り、サブの自我である「${t0Name}」と、本来隠すべき最深欲求「${t1Name}」が前面に露出しています。本音を隠しきれておらず、行動の矛盾や葛藤のブレが表に漏れ出ている状態です。`;
                break;
            default:
                strengthTitle = "【ひみつ強度：測定不能】複雑系バグ";
                strengthDesc = `スコアが同点で拮抗しており、あなたの防衛システムは解析不能なバグを起こしています。`;
                break;
        }
    }

    document.getElementById('secret-strength-title').innerText = strengthTitle;
    document.getElementById('secret-order-text').innerText = `内部強度: [ ${orderNumbers} ]`;
    document.getElementById('secret-strength-desc').innerText = strengthDesc;

    const sData = enneaData[computedData.calcWing];
    const lData = enneaData[computedData.triLast];

    // 【激レアギミック】詳細文も被り（特異点）専用に変更
    if (computedData.calcWing === computedData.triLast) {
        document.getElementById('result-title').innerText = `【${sData.name}】の無限ループバグ`;
        document.getElementById('result-description').innerHTML = `
            <div style="margin-bottom:20px; padding-bottom:15px;">
                <strong style="color:var(--accent-color); font-size:1.15rem;"><i class="fa-solid fa-infinity"></i> 【防衛と欲求の完全一致】（過剰濃縮：${computedData.calcWing}）</strong><br>
                <p style="margin-top:5px; font-size:0.95rem; line-height:1.5;">
                    あなたのログはシステム上で特異なバグを起こしています。<br>
                    「<strong>${sData.fear}</strong>」から心を守るために防衛線を張りますが、心の最深部にある欲求もまた「<strong>${sData.desire}</strong>」です。<br>
                    逃げても逃げても同じ場所に辿り着く、逃げ場のないループ構造こそが、あなたの抱える最大の「ひみつ」です。
                </p>
            </div>
        `;
    } else {
        document.getElementById('result-title').innerText = `矛盾するベクトルの衝突`;
        document.getElementById('result-description').innerHTML = `
            <div style="margin-bottom:20px; border-bottom:1px dashed #ccc; padding-bottom:15px;">
                <strong style="color:var(--accent-color); font-size:1.15rem;"><i class="fa-solid fa-shield-halved"></i> 【影の防衛ベクトル】（ウィング：${computedData.calcWing} / ${sData.name}）</strong><br>
                <p style="margin-top:5px; font-size:0.95rem; line-height:1.5;">
                    あなたは、自分の最も深い恐怖である「<strong>${sData.fear}</strong>」から心を守るため、無意識に「<strong>${sData.desire}</strong>」への執着として防衛線を張っています。<br>
                    ${sData.shadow}
                </p>
            </div>
            <div>
                <strong style="color:#228b22; font-size:1.15rem;"><i class="fa-solid fa-wand-magic-sparkles"></i> 【光の欲求ベクトル】（トライ最後：${computedData.triLast} / ${lData.name}）</strong><br>
                <p style="margin-top:5px; font-size:0.95rem; line-height:1.5;">
                    しかし、心の最深部（トライタイプの末尾）に隠したあなたの真の本音は、「<strong>${lData.desire}</strong>」を満たしたいという、ひみつの欲求です。<br>
                    ${lData.light}
                </p>
            </div>
        `;
    }

    new Chart(document.getElementById('enneagramChart'), {
        type: 'bar',
        data: {
            labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'],
            datasets: [{ label: 'エニアグラムスコア', data: [scores.T1, scores.T2, scores.T3, scores.T4, scores.T5, scores.T6, scores.T7, scores.T8, scores.T9], backgroundColor: '#8b0000' }]
        },
        options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
    });

    document.getElementById('action-log-list').innerHTML = `
        <li>⚖️ 中立防衛: ${actionLog.neutralCount}回</li>
        <li>🚪 2つの扉: ${actionLog.doorAction || "未検知"}</li>
        <li>🪞 反転鏡: ${actionLog.mirrorAction || "未検知"}</li>
        <li>📦 秘密の箱: ${actionLog.boxAction || "未検知"}</li>
        <li>🔑 リスク鍵: ${actionLog.riskKey || "未検知"}</li>
        <li>🐛 芋虫攻撃: ${actionLog.bugSquish}回</li>
    `;
}

// コピーボタン（行動ログ生データのみコピー仕様）
document.getElementById('copy-log-btn').addEventListener('click', () => {
    const text = `⚖️ 中立防衛: ${actionLog.neutralCount}回\n🚪 2つの扉: ${actionLog.doorAction || "未検知"}\n🪞 反転鏡: ${actionLog.mirrorAction || "未検知"}\n📦 秘密の箱: ${actionLog.boxAction || "未検知"}\n🔑 リスク鍵: ${actionLog.riskKey || "未検知"}\n🐛 芋虫攻撃: ${actionLog.bugSquish}回`;
    navigator.clipboard.writeText(text).then(() => {
        showModal("行動ログ（生データ）のみをクリップボードにコピーしたよ♡");
    }).catch(err => { alert("コピーに失敗しました。"); });
});

// ナビゲーション共有
document.getElementById('share-btn').addEventListener('click', () => {
    const calculatedType = document.getElementById('result-calculated-type').innerText;
    const strength = document.getElementById('secret-strength-title').innerText;
    const order = document.getElementById('secret-order-text').innerText;
    
    const text = `━━━━━━━━━━━━━━\n🔐 ひみつのねじれ観測\nあなたの「本音」の観測結果\n━━━━━━━━━━━━━━\n自認：${selfTypeInput}\n深層：${calculatedType}\n${strength}\n${order}`;
    
    if (navigator.share) {
        navigator.share({ title: 'ひみつのねじれ観測', text: text, url: window.location.href }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
            showModal("結果テキストをコピーしたよ♡\nLINEやnoteに貼り付けてね。");
        });
    }
});

// 画像保存 (html2canvas)
document.getElementById('save-img-btn').addEventListener('click', () => {
    window.scrollTo(0, 0);
    html2canvas(document.getElementById('capture-area'), { backgroundColor: "#f4ebd0", scale: 2 }).then(canvas => {
        let link = document.createElement('a');
        link.download = 'secret_book_result.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

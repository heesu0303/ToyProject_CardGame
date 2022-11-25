// html환경에서는 파일을 임포트해올때 .js를 생략하면 안됩니다.
import Component from "../core/Component.js";
import Modal from "./Modal.js";
import CardList from "./CardList.js";

class CardGame extends Component {
  constructor($target) {
    super($target);
    this.clickCount = 0;
    this.$prevCardItem = "";
    this.prevCardData = "";
    this.hitScore = 0;
    this.failScore = 0;
    this.timerId = "";
  }

  template() {
    return ` 
    <h1 class="tit-game">피카츄 카드 게임</h1>
    <main class="main-wrapper">
        <article class="arti-level-setting">
          <h2 class="tit-diff-board ir">난이도 설정</h2>
          <button class="btn-easy" type="button" data-level="4">4 X 4</button>
          <button class="btn-midium" type="button" data-level="6">6 X 6</button>
          <button class="btn-hard" type="button" data-level="8">8 X 8</button>
        </article>

        <article class="arti-score-board">
        <h2 class="tit-score-board ir">스코어 보드</h2>
        <marquee>
        <strong>종합점수</strong>
        총 승리 : 3
        총 패배 : 1
        <strong>난이도별 클리어 타임</strong>
        어려움 (8*8) : 64s
        중간 (6*6) : 54s
        쉬움 (4*4) : 32s
        <strong>이전 기록</strong>
        뒤집은 총 횟수 : 1565
        맞은 횟수 :15
        틀린 횟수 :155
        </marquee>
      </article>
    </main>
    <footer></footer>
    <article class="art-modal"></article>
    `;
  }

  handleLevelBtn(event) {
    if (!(event.target.tagName === "BUTTON")) {
      return;
    }

    //이동시 배경 요소를 변경하는 옵션
    this.inGameStyle();

    this.paintCardGame(Number(event.target.dataset.level));
  }
  // 난이도 설정 버튼에 이벤트 리스너 추가
  addEvent() {
    const $article = document.querySelector(".arti-level-setting");

    $article.addEventListener("click", this.handleLevelBtn.bind(this));
  }
  // json파일에서 카드 데이터 불러오기
  async getData(totalCardCount) {
    const data = await (await fetch(`/json/card.json`)).json();

    return data.slice(0, totalCardCount / 2);
  }

  //카드 그려주기
  async paintCardGame(level) {
    this.$target.innerHTML = "";
    this.totalCardCount = level * level;
    // this.limitTime = level * 10;
    this.limitTime = 2;

    // 모든 카드 렌더링
    const cardData = await this.getData(this.totalCardCount);
    const totalCardData = cardData.concat(cardData);

    // 랜덤하게 모든 카드를 섞기
    totalCardData.sort(() => Math.random() - 0.5);

    //카드 그려주기
    this.paintCard(totalCardData);

    //타이머 실행
    this.timer(this.limitTime);
  }

  //카드 Elements 생성해서 Rendor 하기
  paintCard(cardData) {
    const $cardList = document.createElement("ul");
    $cardList.classList.add("list-card");
    $cardList.addEventListener("click", this.flipCard.bind(this));

    //CardList Component 생성 과 동시에 모든 카드 렌더링 후 cardList 에 추가
    new CardList($cardList, cardData);

    this.$target.appendChild($cardList);
  }

  timer(limitTime) {
    // 시간을 흘러가게 하면서 시간이 종료되면 모달창을 띄워준 뒤 초기화면
    // 게임을 클리어하면 타이머함수를 종료시킨뒤에 모달창을 띄우고 시간을 변수에 저장
    // Class 프로퍼티에 저장해주는 이유 => 다른 곳에서도 타이머 함수를 종료시켜줘야 할 상황이 있을수도 있음.
    this.timerId = setInterval(() => {
      limitTime--;
      if (limitTime === 0) {
        alert("시간종료 !");
        this.resetStyle();
        this.modal();
      }
    }, 1000);
  }

  inGameStyle() {
    document.querySelector(".tit-game").classList.add("ir");
    document.body.classList.add("inGame");
  }

  resetStyle() {
    this.setup();
    this.initialBackground();
    clearInterval(this.timerId);
  }

  initialBackground() {
    document.querySelector(".tit-game").classList.remove("ir");
    document.body.classList.remove("inGame");
  }

  flipCard(event) {
    if (!(event.target.className === "div-back")) {
      return;
    }

    this.clickCount += 1;

    const $cardItem = event.target.parentNode;
    const $back = event.target;
    const $front = $back.nextSibling.nextSibling;

    $cardItem.classList.add("active");
    $front.classList.remove("div-hidden");

    const currentCardData = $front.style.backgroundPosition.split(" ").map((item) => parseInt(item)); // 현재 클릭 카드의 [x, y] 값

    if (!this.prevCardData) {
      // 첫번째로 클릭 카드의 데이터가 없으면
      this.prevCardData = currentCardData; // Card 데이터 넣어주고
      this.$prevCardItem = event.target.parentNode; //Card $List 넣어줘야함
    } else {
      //첫번째 카드 데이터가 있으면 아래 로직
      if (JSON.stringify(this.prevCardData) == JSON.stringify(currentCardData)) {
        setTimeout(() => {
          this.gotCard(event.target.parentNode);
        }, 400);
      } else {
        this.failScore++;
      }
    }
    //2장 모두 뒤집었을때 초기화 코드
    if (this.clickCount >= 2) {
      const $backDiv = document.querySelectorAll(".div-back");
      $backDiv.forEach((item) => {
        item.style.pointerEvents = "none";
      });
      setTimeout(() => {
        this.$prevCardItem.classList.remove("active");
        $cardItem.classList.remove("active");
        this.replaceCard();
        this.prevCardData = "";
        this.$prevCardItem = "";
      }, 800);
      this.clickCount = 0;

      return;
    }
    // 카드 카운트가 2가 되면 모든 카드 다시 뒤집기
  }

  gotCard(colletCard) {
    // 비교해서 맞는거 할라면 data-x , data-y 비교해서 같으면 Got
    this.$prevCardItem.classList.add("div-hidden");
    colletCard.classList.add("div-hidden");

    this.hitScore++;
  }

  // 카드 뒤집기
  replaceCard() {
    const $backDiv = document.querySelectorAll(".div-back");
    const $frontDiv = document.querySelectorAll(".div-front");
    $frontDiv.forEach((item) => {
      item.classList.add("div-hidden");
    });
    $backDiv.forEach((item) => {
      item.classList.remove("div-hidden");
      item.style.pointerEvents = "auto";
    });
  }

  modal() {
    const score = {}; //임시
    const winLose = false; //임시

    new Modal(score, winLose, this.restart, this.goHome);
  }

  restart() {}
}
export default CardGame;

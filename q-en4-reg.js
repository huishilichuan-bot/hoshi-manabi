/* ほしまなび 英語 v1.6 — 4技能の英語を学年に登録（ほかの英語の単元は入れかえる） */
(function (root) {
  "use strict";
  const HM = root.HM, E4 = HM.EN4;
  const reg = () => {
    E4.reset();
    E4.addGrade(3, E4.E.G3); E4.addGrade(4, E4.E.G4); E4.addGrade(5, E4.E.G5); E4.addGrade(6, E4.E.G6);
    E4.addGrade(7, E4.J7); E4.addGrade(8, E4.J8); E4.addGrade(9, E4.J9);
  };
  (HM.finalizers = HM.finalizers || []).push(reg);
})(typeof window !== "undefined" ? window : globalThis);

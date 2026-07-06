/*
 * challenges-data.js — pool of daily challenges.
 *
 * Each challenge:
 *   id         unique string
 *   lang       language tag (for display)
 *   difficulty 'easy' | 'medium' | 'hard'
 *   type       'mc'   multiple choice   -> options[], answer = correct index
 *              'code' code completion   -> answers[] = accepted normalized strings
 *              'free' freetext          -> solution shown, user self-marks done
 *   prompt     question / task text
 *   code       optional code snippet shown in a <pre> block
 */
(function (global) {
  'use strict';

  const CHALLENGES = [
    /* ── EASY ── */
    {
      id: 'js-typeof', lang: 'JavaScript', difficulty: 'easy', type: 'mc',
      prompt: 'Was gibt `typeof null` in JavaScript zurück?',
      options: ['"null"', '"object"', '"undefined"', '"number"'],
      answer: 1
    },
    {
      id: 'py-print', lang: 'Python', difficulty: 'easy', type: 'code',
      prompt: 'Vervollständige den Funktionsaufruf, um "Hello" auszugeben:',
      code: '____("Hello")',
      answers: ['print']
    },
    {
      id: 'html-anchor', lang: 'HTML', difficulty: 'easy', type: 'mc',
      prompt: 'Welches HTML-Element erzeugt einen Hyperlink?',
      options: ['<link>', '<a>', '<href>', '<url>'],
      answer: 1
    },
    {
      id: 'sql-select-all', lang: 'SQL', difficulty: 'easy', type: 'code',
      prompt: 'Schreibe das Symbol, das in SELECT alle Spalten auswählt:',
      code: 'SELECT ____ FROM users;',
      answers: ['*']
    },
    {
      id: 'cs-print', lang: 'C#', difficulty: 'easy', type: 'mc',
      prompt: 'Wie gibt man in C# Text auf der Konsole aus?',
      options: ['System.out.println("x")', 'Console.WriteLine("x")', 'print("x")', 'echo "x"'],
      answer: 1
    },
    {
      id: 'ts-bool', lang: 'TypeScript', difficulty: 'easy', type: 'code',
      prompt: 'Ergänze den Typ-Annotation für einen boolean:',
      code: 'let done: ____ = true;',
      answers: ['boolean']
    },
    {
      id: 'c-header', lang: 'C', difficulty: 'easy', type: 'mc',
      prompt: 'Welcher Header wird für printf() benötigt?',
      options: ['<stdlib.h>', '<stdio.h>', '<string.h>', '<math.h>'],
      answer: 1
    },
    {
      id: 'js-const', lang: 'JavaScript', difficulty: 'easy', type: 'mc',
      prompt: 'Welches Keyword deklariert eine Variable, die nicht neu zugewiesen werden kann?',
      options: ['var', 'let', 'const', 'static'],
      answer: 2
    },
    {
      id: 'py-list', lang: 'Python', difficulty: 'easy', type: 'code',
      prompt: 'Vervollständige, um die Länge einer Liste zu erhalten:',
      code: 'n = ____(my_list)',
      answers: ['len']
    },
    {
      id: 'html-list', lang: 'HTML', difficulty: 'easy', type: 'free',
      prompt: 'Erstelle eine ungeordnete Liste mit zwei Einträgen "A" und "B".',
      solution: '<ul>\n  <li>A</li>\n  <li>B</li>\n</ul>'
    },

    /* ── MEDIUM ── */
    {
      id: 'js-map', lang: 'JavaScript', difficulty: 'medium', type: 'code',
      prompt: 'Verdopple jedes Element mit map(). Ergänze die Methode:',
      code: 'const doubled = nums.____(n => n * 2);',
      answers: ['map']
    },
    {
      id: 'py-comprehension', lang: 'Python', difficulty: 'medium', type: 'code',
      prompt: 'Erzeuge eine Liste der Quadrate von 0..4 per List-Comprehension:',
      code: 'squares = [x*x ____ x in range(5)]',
      answers: ['for']
    },
    {
      id: 'sql-join', lang: 'SQL', difficulty: 'medium', type: 'mc',
      prompt: 'Welcher JOIN liefert nur Zeilen mit Übereinstimmung in beiden Tabellen?',
      options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'],
      answer: 2
    },
    {
      id: 'cs-linq', lang: 'C#', difficulty: 'medium', type: 'code',
      prompt: 'Filtere mit LINQ alle geraden Zahlen. Ergänze die Methode:',
      code: 'var evens = nums.____(n => n % 2 == 0);',
      answers: ['Where']
    },
    {
      id: 'ts-generic', lang: 'TypeScript', difficulty: 'medium', type: 'mc',
      prompt: 'Wie deklariert man eine generische Identitäts-Funktion korrekt?',
      options: [
        'function id<T>(x: T): T { return x; }',
        'function id(x: T): T { return x; }',
        'function id<T>(x): x { return x; }',
        'function id[T](x: T): T { return x; }'
      ],
      answer: 0
    },
    {
      id: 'js-async', lang: 'JavaScript', difficulty: 'medium', type: 'mc',
      prompt: 'Welches Keyword wartet innerhalb einer async-Funktion auf ein Promise?',
      options: ['yield', 'await', 'defer', 'async'],
      answer: 1
    },
    {
      id: 'py-dict', lang: 'Python', difficulty: 'medium', type: 'code',
      prompt: 'Hole den Wert zu "age" mit Standardwert 0, falls fehlend:',
      code: 'a = person.____("age", 0)',
      answers: ['get']
    },
    {
      id: 'c-pointer', lang: 'C', difficulty: 'medium', type: 'mc',
      prompt: 'Was liefert `&x` in C?',
      options: ['Den Wert von x', 'Die Adresse von x', 'x dereferenziert', 'Ein Array'],
      answer: 1
    },
    {
      id: 'sql-count', lang: 'SQL', difficulty: 'medium', type: 'code',
      prompt: 'Zähle alle Zeilen der Tabelle orders:',
      code: 'SELECT ____(*) FROM orders;',
      answers: ['count']
    },
    {
      id: 'html-form', lang: 'HTML', difficulty: 'medium', type: 'free',
      prompt: 'Schreibe ein Formular mit einem Text-Input (name="email") und einem Submit-Button.',
      solution: '<form>\n  <input type="text" name="email">\n  <button type="submit">Senden</button>\n</form>'
    },

    /* ── HARD ── */
    {
      id: 'js-closure', lang: 'JavaScript', difficulty: 'hard', type: 'mc',
      prompt: 'Was gibt dieser Code aus?',
      code: 'function c(){let n=0;return ()=>++n;}\nconst f=c();\nconsole.log(f(),f(),f());',
      options: ['0 0 0', '1 1 1', '1 2 3', 'undefined'],
      answer: 2
    },
    {
      id: 'py-decorator', lang: 'Python', difficulty: 'hard', type: 'code',
      prompt: 'Ergänze das Symbol, um einen Decorator "cache" anzuwenden:',
      code: '____cache\ndef fib(n): ...',
      answers: ['@']
    },
    {
      id: 'sql-window', lang: 'SQL', difficulty: 'hard', type: 'code',
      prompt: 'Ergänze das Keyword für eine Window-Funktion (Partition/Order):',
      code: 'SELECT name, RANK() ____ (ORDER BY score DESC) FROM players;',
      answers: ['over']
    },
    {
      id: 'cs-async-ret', lang: 'C#', difficulty: 'hard', type: 'mc',
      prompt: 'Welcher Rückgabetyp passt zu einer async-Methode ohne Ergebniswert (nicht void)?',
      options: ['Task', 'void', 'Async', 'IEnumerable'],
      answer: 0
    },
    {
      id: 'ts-utility', lang: 'TypeScript', difficulty: 'hard', type: 'mc',
      prompt: 'Welcher Utility-Type macht alle Properties optional?',
      options: ['Required<T>', 'Readonly<T>', 'Partial<T>', 'Pick<T,K>'],
      answer: 2
    },
    {
      id: 'c-malloc', lang: 'C', difficulty: 'hard', type: 'code',
      prompt: 'Reserviere Speicher für 10 int. Ergänze die Funktion:',
      code: 'int *a = ____(10 * sizeof(int));',
      answers: ['malloc']
    },
    {
      id: 'js-dedupe', lang: 'JavaScript', difficulty: 'hard', type: 'code',
      prompt: 'Entferne Duplikate aus arr mit einem Set. Ergänze:',
      code: 'const unique = [...new ____(arr)];',
      answers: ['Set']
    },
    {
      id: 'py-generator', lang: 'Python', difficulty: 'hard', type: 'mc',
      prompt: 'Welches Keyword macht eine Funktion zu einem Generator?',
      options: ['return', 'async', 'yield', 'gen'],
      answer: 2
    },
    {
      id: 'sql-transaction', lang: 'SQL', difficulty: 'hard', type: 'free',
      prompt: 'Schreibe eine Transaktion, die zwei UPDATEs ausführt und danach bestätigt (commit).',
      solution: 'BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;'
    },
    {
      id: 'ts-narrow', lang: 'TypeScript', difficulty: 'hard', type: 'free',
      prompt: 'Schreibe einen Type-Guard `isString(x): x is string`.',
      solution: 'function isString(x: unknown): x is string {\n  return typeof x === "string";\n}'
    }
  ];

  global.FCSChallenges = CHALLENGES;
})(window);

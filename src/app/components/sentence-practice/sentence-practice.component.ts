import { Component, input, signal, computed, effect, inject, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import type { SentenceType } from '../../types';
import { DbService } from '../../services/db.service';

@Component({
  selector: 'app-sentence-practice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sentence-practice.component.html',
  styleUrl: './sentence-practice.component.scss'
})
export class SentencePracticeComponent {
  private db = inject(DbService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  hiddenInput = viewChild<ElementRef<HTMLInputElement>>('hiddenInput');

  // Inputs
  direction = input.required<'forward' | 'reverse'>();
  isFullBatch = input<boolean>(false);

  // State
  batch = signal<SentenceType[]>([]);
  currentIndex = signal(0);
  completedWordsIndex = signal(0);
  inputValue = signal('1');
  
  // Computed
  currentSentence = computed(() => {
    const b = this.batch();
    const idx = this.currentIndex();
    return b.length > idx ? b[idx] : null;
  });

  promptText = computed(() => {
    const s = this.currentSentence();
    if (!s) return '';
    return this.direction() === 'forward' ? s.original : s.translation;
  });

  targetText = computed(() => {
    const s = this.currentSentence();
    if (!s) return '';
    return this.direction() === 'forward' ? s.translation : s.original;
  });

  words = computed(() => {
    const text = this.targetText().trim();
    return text ? text.split(/\s+/) : [];
  });

  isFullyRevealed = computed(() => this.completedWordsIndex() >= this.words().length);
  
  option3 = computed(() => {
    const s = this.currentSentence();
    if (!s) return 2;
    return s.rate === 0 ? 2 : (s.rate || 2);
  });
  
  option4 = computed(() => Math.max(3, Math.floor(this.option3() * 1.4)));

  constructor() {
    // Load sentences
    this.loadSentences();

    // Reset Word Revelations and Rating Inputs when sentence changes
    effect(() => {
      const sentence = this.currentSentence();
      if (sentence) {
        this.completedWordsIndex.set(0);
        this.inputValue.set(sentence.rate === 1 ? '2' : '1');
        if (sentence.rate === 0) this.inputValue.set('1');
      }
    }, { allowSignalWrites: true });

    // Handle non-alphanumeric auto-advance
    effect(() => {
      const sentence = this.currentSentence();
      const idx = this.completedWordsIndex();
      const wordsArr = this.words();
      
      if (!sentence) return;
      if (idx < wordsArr.length) {
        const currentWord = wordsArr[idx];
        const hasAlphaNum = /[a-z0-9]/i.test(currentWord);
        if (!hasAlphaNum) {
          this.completedWordsIndex.update(v => v + 1);
        }
      }
    }, { allowSignalWrites: true });

    // Auto-focus hidden input during typing phase
    effect(() => {
      const revealed = this.isFullyRevealed();
      const inputEl = this.hiddenInput()?.nativeElement;
      if (!revealed && inputEl) {
        inputEl.focus();
      }
    });
  }

  async loadSentences() {
    try {
      const allSentences = await this.db.sentences.toArray();
      const now = Date.now();
      const initialId = this.route.snapshot.queryParamMap.get('sentenceId');
      
      let targetList: SentenceType[];

      if (!this.isFullBatch()) {
        targetList = allSentences.filter(s => typeof s.dueAt === 'number' && s.dueAt <= now);
      } else {
        targetList = allSentences.filter(s => s.rate !== 0);
        // Shuffle
        for (let i = targetList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [targetList[i], targetList[j]] = [targetList[j], targetList[i]];
        }
      }

      if (initialId) {
        const target = allSentences.find(s => s.id === initialId);
        if (target) {
          const rest = targetList.filter(s => s.id !== initialId);
          this.batch.set([target, ...rest]);
        } else {
          this.batch.set(targetList);
        }
      } else {
        this.batch.set(targetList);
      }
    } catch (error) {
      console.error('Error fetching sentences:', error);
    }
  }

  onTyping(event: Event) {
    const input = event.target as HTMLInputElement;
    const typed = input.value.slice(-1).toLowerCase();
    input.value = ''; // Reset for next char
    
    if (!typed) return;
    
    const wordsArr = this.words();
    const idx = this.completedWordsIndex();
    if (idx < wordsArr.length) {
      const currentWord = wordsArr[idx];
      const match = currentWord.match(/[a-z0-9]/i);
      const expectedChar = match ? match[0].toLowerCase() : null;
      
      if (expectedChar && typed === expectedChar) {
        this.completedWordsIndex.update(v => v + 1);
      }
    }
  }

  showAnswer() {
    this.completedWordsIndex.set(this.words().length);
  }

  async handleRate(rateArg: string | number) {
    const sentence = this.currentSentence();
    if (!sentence) return;

    const numericRate = typeof rateArg === 'string' 
      ? (rateArg === '' ? 1 : parseInt(rateArg)) 
      : rateArg;

    try {
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      const minuteInMs = 60 * 1000;

      const dueAt = numericRate === 0
        ? now + 10 * minuteInMs
        : now + numericRate * dayInMs;

      await this.db.sentences.update(sentence.id, { rate: numericRate, dueAt });

      if (this.route.snapshot.queryParamMap.get('sentenceId')) {
        this.router.navigate(['/sentence'], { replace: true });
      } else {
        this.currentIndex.update(v => v + 1);
      }
    } catch (error) {
      console.error('Error updating sentence:', error);
    }
  }

  handleMove(step: number) {
    this.batch.update(prev => {
      const newBatch = [...prev];
      const cardToMove = newBatch.splice(this.currentIndex(), 1)[0];
      const insertIndex = (this.currentIndex() + step) % (newBatch.length + 1);
      newBatch.splice(insertIndex, 0, cardToMove);
      return newBatch;
    });
    this.completedWordsIndex.set(0);
  }

  handleSkip() {
    this.batch.update(prev => {
      const newBatch = [...prev];
      const cardToMove = newBatch.splice(this.currentIndex(), 1)[0];
      newBatch.push(cardToMove);
      return newBatch;
    });
    this.completedWordsIndex.set(0);
  }

  onEdit() {
    const s = this.currentSentence();
    if (s && confirm('Sure you want to leave the page?')) {
      this.router.navigate(['/sentenceForm', s.id]);
    }
  }

  onInputChange(val: string) {
    const num = val === '' ? '' : Math.max(1, Math.min(999, +val)).toString();
    this.inputValue.set(num);
  }

  onInputFocus() {
    this.inputValue.set('');
  }

  focusHiddenInput() {
    this.hiddenInput()?.nativeElement.focus();
  }

  getWordDisplay(word: string, index: number) {
    const isCompleted = index < this.completedWordsIndex();
    return isCompleted ? word : word.replace(/[a-z0-9]/gi, '_');
  }
}

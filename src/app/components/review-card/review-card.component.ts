import { Component, input, signal, output, computed, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { CardCategory, CardType } from '../../types';
import { FlashcardComponent } from '../flashcard/flashcard.component';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule, FormsModule, FlashcardComponent],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.scss'
})
export class ReviewCardComponent {
  flashcard = viewChild(FlashcardComponent);

  // Inputs
  card = input.required<CardType>();
  allCards = input.required<CardType[]>();
  category = input.required<CardCategory>();

  // Outputs
  rate = output<number>();
  move = output<number>();
  skip = output<void>();

  // State
  inputValue = signal('1');

  // Computed
  option3 = computed(() => {
    const rate = this.card().rate;
    return rate === 0 ? 2 : (rate || 2);
  });

  option4 = computed(() => Math.max(3, Math.floor(this.option3() * 1.4)));

  isInverseOrGroup = computed(() => {
    const url = window.location.pathname;
    return url.includes('/inverse') || url.includes('/groups');
  });

  constructor() {
    effect(() => {
      const card = this.card();
      const currentInput = this.inputValue();
      
      if (card.rate === parseInt(currentInput)) {
        this.inputValue.set(card.rate === 1 ? '2' : '1');
      }
      if (card.rate === 0 && currentInput === '2') {
        this.inputValue.set('1');
      }
      
      const flash = this.flashcard();
      if (flash) {
        flash.reset();
      }
    });
  }

  handleRateCard(rate: string | number) {
    const numericRate = typeof rate === 'string' 
      ? (rate === '' ? 1 : parseInt(rate)) 
      : rate;
    this.rate.emit(numericRate);
  }

  onInputChange(val: string) {
    const num = val === '' ? '' : Math.max(1, Math.min(999, +val)).toString();
    this.inputValue.set(num);
  }

  onInputFocus() {
    this.inputValue.set('');
  }
}

import { Component, input, signal, output, computed, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { CardCategory, CardType } from '../../types';
import { FlashcardComponent } from '../flashcard/flashcard.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, FormsModule, FlashcardComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  flashcard = viewChild(FlashcardComponent);

  // Inputs
  card = input.required<CardType>();
  allCards = input.required<CardType[]>();
  selectedCategory = input.required<CardCategory>();

  // Outputs
  rateCard = output<number>();
  categoryChange = output<CardCategory>();
  edit = output<CardType>();

  // State
  inputValue = signal('1');

  // Computed
  option3 = computed(() => {
    const rate = this.card().rate;
    return rate === 0 ? 2 : (rate || 2);
  });

  option4 = computed(() => Math.max(3, Math.floor(this.option3() * 1.4)));

  allCategories: CardCategory[] = ['EN to NL', 'Question NL', 'Dev'];
  
  categoriesWithCards = computed(() => {
    const set = new Set<CardCategory>();
    for (const c of this.allCards()) {
      set.add(c.category || 'EN to NL');
    }
    return set;
  });

  constructor() {
    // Reset internal state when card changes
    effect(() => {
      const card = this.card();
      const currentInput = this.inputValue();
      
      // Ported logic from React useEffect
      if (card.rate === parseInt(currentInput)) {
        this.inputValue.set(card.rate === 1 ? '2' : '1');
      }
      if (card.rate === 0 && currentInput === '2') {
        this.inputValue.set('1');
      }
      
      // Reset the base flashcard reveal count
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
    this.rateCard.emit(numericRate);
  }

  handleCategoryChange(event: Event) {
    const newCategory = (event.target as HTMLSelectElement).value as CardCategory;
    this.categoryChange.emit(newCategory);
  }

  onInputChange(val: string) {
    const num = val === '' ? '' : Math.max(1, Math.min(999, +val)).toString();
    this.inputValue.set(num);
  }

  onInputFocus() {
    this.inputValue.set('');
  }
}

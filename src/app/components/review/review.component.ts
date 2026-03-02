import { Component, input, signal, output, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CardType } from '../../types';
import { ReviewCardComponent } from '../review-card/review-card.component';
import { formatDueAt } from '../../utils/utils';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, ReviewCardComponent],
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss'
})
export class ReviewComponent {
  // Inputs
  cards = input.required<CardType[]>();
  
  // Outputs
  rateCard = output<{ card: CardType, rate: number }>();
  clearUrl = output<void>();
  updateBatch = output<CardType[]>(); // To update the parent's card list

  // State
  currentCardIndex = signal(0);

  // Computed
  currentCard = computed(() => {
    const batch = this.cards();
    const index = this.currentCardIndex();
    return batch.length > 0 ? batch[index] : null;
  });

  constructor() {
    // Sync index when cards change
    effect(() => {
      const batchLength = this.cards().length;
      const index = this.currentCardIndex();
      
      if (batchLength === 0) {
        this.currentCardIndex.set(0);
      } else if (index >= batchLength) {
        this.currentCardIndex.set(0);
      }
    }, { allowSignalWrites: true });
  }

  handleNextCard() {
    this.clearUrl.emit();
    this.currentCardIndex.update(prev => {
      const nextIndex = prev + 1;
      return nextIndex >= this.cards().length ? 0 : nextIndex;
    });
  }

  async handleRate(rate: number) {
    const card = this.currentCard();
    if (!card) return;

    // Notify parent to update DB
    this.rateCard.emit({ card, rate });
    this.clearUrl.emit();

    // Remove from batch
    const newBatch = this.cards().filter(c => c.id !== card.id);
    this.updateBatch.emit(newBatch);

    // Update index
    this.currentCardIndex.update(prev => {
      if (prev >= newBatch.length - 1) return 0;
      return prev;
    });
  }

  handleMove(step: number) {
    const cardToMove = this.currentCard();
    if (!cardToMove) return;

    this.clearUrl.emit();
    
    const batch = [...this.cards()];
    const index = this.currentCardIndex();
    
    // Remove from current position
    const newBatchWithoutCard = batch.filter((_, i) => i !== index);
    
    // Calculate new position
    const finalLength = newBatchWithoutCard.length + 1;
    const insertIndex = (index + step) % finalLength;
    
    const newBatch = [...newBatchWithoutCard];
    newBatch.splice(insertIndex, 0, cardToMove);
    
    this.updateBatch.emit(newBatch);
  }

  getFormattedDue() {
    const card = this.currentCard();
    return card ? formatDueAt(card.dueAt) : '';
  }
}

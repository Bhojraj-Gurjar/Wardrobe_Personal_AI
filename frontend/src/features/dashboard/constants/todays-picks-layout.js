export const TODAYS_PICKS_SKELETON_COUNT = 4;

export const TODAYS_PICKS_ROW_CLASS = [
  'flex w-full min-w-0 flex-nowrap items-stretch gap-4',
  'overflow-x-auto overscroll-x-contain snap-x snap-mandatory',
  '[scrollbar-width:none] [-ms-overflow-style:none]',
  '[&::-webkit-scrollbar]:hidden',
].join(' ');

/**
 * Equal-width cards when they fit; horizontal scroll when min-widths exceed the row.
 */
export const TODAYS_PICKS_CARD_SLOT_CLASS = [
  'h-full min-w-[11.5rem] max-w-[16rem] flex-[1_1_0] snap-start',
  'sm:min-w-[12.5rem]',
].join(' ');

export function getTodaysPicksRowStyle(count) {
  return { '--pick-count': String(Math.max(count, 1)) };
}

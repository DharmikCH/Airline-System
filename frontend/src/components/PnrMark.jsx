// The PNR, set as the one enormous mark on the ticket: six ruled cells, one
// character each, so it reads like a code to copy rather than a word.
//
// When `reveal` is set (straight after booking) the cells print in one after
// another. With reduced motion they simply appear.
export default function PnrMark({ pnr, reveal = false }) {
  return (
    <div className={'pnr' + (reveal ? ' is-revealing' : '')} aria-label={'PNR ' + pnr.split('').join(' ')} role="img">
      {pnr.split('').map((char, i) => (
        <span key={i} className="pnr-cell" style={{ '--i': i }} aria-hidden="true">
          {char}
        </span>
      ))}
    </div>
  );
}

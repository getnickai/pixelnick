type MetaIconProps = {
  className?: string;
};

/** Meta row icons — inherit `text-zinc-400` (or any parent `color`). */
export function MetaIconCalendar({ className }: MetaIconProps) {
  return (
    <svg
      viewBox="0 0 19.5 21.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8.75 12.75H13.75M5.75 12.75H5.75898M10.75 16.75H5.75M13.75 16.75H13.741M14.25 0.75V4.75M5.25 0.75V4.75M0.75 8.75H18.75M18.75 2.75H0.75V20.75H18.75V2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function MetaIconNodes({ className }: MetaIconProps) {
  return (
    <svg
      viewBox="0 0 22.3375 18.17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M11.1687 4.9175V0.75H7.00125M0.75 11.1687H2.83375M19.5037 11.1687H21.5875M14.2944 10.1269V12.2106M8.04312 10.1269V12.2106M4.9175 4.9175H17.42C18.5701 4.9175 19.5037 5.8512 19.5037 7.00125V15.3362C19.5037 16.4863 18.5701 17.42 17.42 17.42H4.9175C3.76745 17.42 2.83375 16.4863 2.83375 15.3362V7.00125C2.83375 5.8512 3.76745 4.9175 4.9175 4.9175Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetaIconClock({ className }: MetaIconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M10 5V10L13.3333 11.6667M1.66667 10C1.66667 14.5993 5.40071 18.3333 10 18.3333C14.5993 18.3333 18.3333 14.5993 18.3333 10C18.3333 5.40071 14.5993 1.66667 10 1.66667C5.40071 1.66667 1.66667 5.40071 1.66667 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

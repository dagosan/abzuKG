/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.

Added for the ERA RINF frontend, 2026-10-29. */

import { RefObject, useLayoutEffect, useRef, useState } from "react";

export interface HeightToViewportBottom {
  ref: RefObject<HTMLDivElement | null>;
  /** Pixels from the element's top to the window's bottom; undefined until measured. */
  height: number | undefined;
}

/**
 * Measures where a page starts, so it can end exactly at the window's
 * bottom. Abzu's fixed header height (104 px) is short of the rendered
 * header, which pushed its own report footer partly out of view.
 */
export const useHeightToViewportBottom = (): HeightToViewportBottom => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const measure = () => {
      const top = ref.current?.getBoundingClientRect().top;
      if (top !== undefined) setHeight(window.innerHeight - top);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return { ref, height };
};

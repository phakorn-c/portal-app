import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    thumbLabels?: readonly string[];
};

const Slider = React.forwardRef<
    React.ComponentRef<typeof SliderPrimitive.Root>,
    SliderProps
>(({ className, value, defaultValue, thumbLabels, ...props }, ref) => {
    const thumbValues = value ?? defaultValue ?? [props.min ?? 0];

    return (
        <SliderPrimitive.Root
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            className={cn(
                'relative flex w-full touch-none select-none items-center',
                className,
            )}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
                <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            {thumbValues.map((_, index) => (
                <SliderPrimitive.Thumb
                    key={index}
                    aria-label={thumbLabels?.[index]}
                    className="block h-6 w-6 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                />
            ))}
        </SliderPrimitive.Root>
    );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

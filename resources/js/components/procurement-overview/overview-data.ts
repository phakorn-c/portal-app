export type Agency = {
    readonly name: string;
    readonly announcements: number;
    readonly projects: number;
    readonly known_budget: number;
    readonly unknown_budget_projects: number;
};

export const count = new Intl.NumberFormat('th-TH-u-nu-latn');
export const millions = new Intl.NumberFormat('th-TH-u-nu-latn', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

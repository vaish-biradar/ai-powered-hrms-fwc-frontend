import { Card, CardContent } from '@/components/ui/card';

export const WhyJoinSection = () => {
  const benefits = [
    {
      title: 'Growth Opportunities',
      description: 'Continuous learning and career advancement paths',
    },
    {
      title: 'Innovation Culture',
      description: 'Work with cutting-edge technologies and methodologies',
    },
    {
      title: 'Work-Life Balance',
      description: 'Flexible work arrangements and comprehensive benefits',
    },
  ];

  return (
    <div className="mt-12 text-left mb-12">
      <h2 className="text-3xl font-bold mb-4">Why Join FWC?</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className='!p-2'>
            <CardContent className="pt-2">
              <h3 className="font-bold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
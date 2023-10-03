"use client";

import { ThemeProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

import { ThemeSwitcher } from "./theme-switcher";

type Props = {
  theme?: ThemeProviderProps;
  children: React.ReactNode;
};

export function Providers({ children, theme }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...theme}
    >
      {children}

      <ThemeSwitcher />
    </ThemeProvider>
  );
}

console.log(`
                         .:^^:.                   
                       .YGGGGGP5?!.               
                       PBGGGGGJ   :^:             
                      .GBGGGGG:      ^.           
                       PBBBBGB~       ^.          
                       ^5Y5PGBY        !.         
                             :7.       ?!         
                                    .!YYJ         
                         ?GGP57:  ?5PP5YY.        
                         :BGGGGG? !P55YY7         
                    .:!!  YGGGGPG!:P55J~          
               .:!JPGBBB: :GGPPPPY~J!:            
            :!YPGGGGGGGG5  YPPPP55:               
          ^YPPPPPPPGGGP5Y. :P55555:               
         :55555PPPY?~:.     J5YYYY.               
         :YYYYYY!.          ^YJJJ?                
          !JJJY~:           :J???:                
           :7??!^!          ~?7~.                 
             .^!!^:      .:^^:                    
                 .........                        
                                                  
            Welcome to Infinitunes!
`);

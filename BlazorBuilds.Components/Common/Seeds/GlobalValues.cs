using Microsoft.AspNetCore.Components;

namespace BlazorBuilds.Components.Common.Seeds;
public class GlobalValues
{
    public const string JavaScript_File_Path                     = "./_content/BlazorBuilds.Components/assets/js/tooltips.js";
    public const string JavaScript_Register_Func                 = "registerTooltip";
    public const string JavaScript_UnRegister_Func               = "unRegisterTooltip";
                                                                 
    public const string Tooltip_KeyBoard_Close_Key               = "Escape";//"Control"; //Use the appropriate key, likely escape or control

    public const string Tooltip_Class                            = "tool-tip";
    public const string Tooltip_Text_Class                       = $"{Tooltip_Class}__text";
    public const string Tooltip_Icon_Button_Class                = $"{Tooltip_Class}__icon-button";
    public const string Tooltip_Hide_Modifier_Class              = $"{Tooltip_Class}--hide";
    public const string Tooltip_Text_Top_Left_Modifier_Class     = $"{Tooltip_Text_Class}--top-left";
    public const string Tooltip_Text_Top_Modifier_Class          = $"{Tooltip_Text_Class}--top";
    public const string Tooltip_Text_Top_Right_Modifier_Class    = $"{Tooltip_Text_Class}--top-right";
    public const string Tooltip_Text_Right_Modifier_Class        = $"{Tooltip_Text_Class}--right";
    public const string Tooltip_Text_Bottom_Left_Modifier_Class  = $"{Tooltip_Text_Class}--bottom-left";
    public const string Tooltip_Text_Bottom_Modifier_Class       = $"{Tooltip_Text_Class}--bottom";
    public const string Tooltip_Text_Bottom_Right_Modifier_Class = $"{Tooltip_Text_Class}--bottom-right";
    public const string Tooltip_Text_Left_Modifier_Class         = $"{Tooltip_Text_Class}--left";

    public const int Tooltip_Tip_Border_Width                    = 10;

    public const string Tooltip_Close_Icon_Class                 = "close-tooltip-icon";
    public const string Tooltip_Tip_Border_Width_Var_Name        = "--_tip-border-width";

    public const string Aria_Attribute_LabelledBy                = "aria-labelledby";
    public const string Aria_Attribute_DescribedBy               = "aria-describedby";

    public const string Style_As_Dark  = "dark";
    public const string Style_As_Light = "light";

    public static string[] GetTooltipModifiers()
       
        => [
            Tooltip_Text_Top_Left_Modifier_Class, Tooltip_Text_Top_Modifier_Class, Tooltip_Text_Top_Right_Modifier_Class,
            Tooltip_Text_Right_Modifier_Class, 
            Tooltip_Text_Bottom_Right_Modifier_Class, Tooltip_Text_Bottom_Modifier_Class, Tooltip_Text_Bottom_Left_Modifier_Class, 
            Tooltip_Text_Left_Modifier_Class
           ];

    public static string? GetStyleAsValue(StyleAs styleAs)

        => styleAs switch
        {
            StyleAs.OnLight => Style_As_Light,
            StyleAs.OnDark  => Style_As_Dark,
            _               => null
        };
}
